import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AdminSessionResult =
  | { ok: true; user: User; isAdmin: true }
  | { ok: false; reason: "signed_out" | "not_admin" | "refresh_failed" | "role_check_failed" };

const OWNER_EMAIL = "info@digiformation.uk";

export const isOwnerEmail = (email?: string | null) =>
  email?.toLowerCase() === OWNER_EMAIL;

/**
 * Get the current session WITHOUT ever calling refreshSession() manually.
 *
 * CRITICAL: The Supabase client is configured with `autoRefreshToken: true`,
 * which uses an internal lock + scheduler to refresh tokens in the background.
 * Calling `refreshSession()` from here in parallel was producing a storm of
 * /token?grant_type=refresh_token calls (visible in auth logs: 8 refreshes in
 * 4 seconds after a single login). Supabase's refresh-token reuse detection
 * then revoked the whole token family and emitted SIGNED_OUT, kicking the
 * user out — especially on desktop where the tab stays open longer and more
 * components subscribe to auth events.
 *
 * Just read from storage. The auto-refresher handles expiry. If the token is
 * truly dead, getSession() returns null and the caller routes to /auth.
 */
export const recoverSession = async (): Promise<{ session: Session | null; error: Error | null }> => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session ?? null, error: error ?? null };
};

/**
 * Returns the user from the local session. Never calls /auth/v1/user (network)
 * unless absolutely necessary, so visibility/focus events don't hammer auth.
 */
export const getReliableUser = async () => {
  const { session, error } = await recoverSession();
  if (error || !session) return { user: null, error };
  return { user: session.user, error: null };
};

// Cache admin-role lookup so re-verification on tab focus / route change does
// not query user_roles repeatedly. 60s is long enough to stop stampedes but
// short enough that a role change takes effect quickly.
type AdminCacheEntry = { userId: string; isAdmin: boolean; at: number };
let adminCache: AdminCacheEntry | null = null;
const ADMIN_TTL_MS = 60_000;

export const clearAdminCache = () => { adminCache = null; };

export const checkAdminSession = async (): Promise<AdminSessionResult> => {
  const { user, error } = await getReliableUser();
  if (!user) {
    return { ok: false, reason: error ? "refresh_failed" : "signed_out" };
  }

  if (isOwnerEmail(user.email)) return { ok: true, user, isAdmin: true };

  if (adminCache && adminCache.userId === user.id && Date.now() - adminCache.at < ADMIN_TTL_MS) {
    if (adminCache.isAdmin) return { ok: true, user, isAdmin: true };
    return { ok: false, reason: "not_admin" };
  }

  const { data, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) return { ok: false, reason: "role_check_failed" };

  const isAdmin = !!data;
  adminCache = { userId: user.id, isAdmin, at: Date.now() };
  if (!isAdmin) return { ok: false, reason: "not_admin" };

  return { ok: true, user, isAdmin: true };
};
