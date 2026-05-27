import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminSessionResult =
  | { ok: true; user: User; isAdmin: true }
  | { ok: false; reason: "signed_out" | "not_admin" | "refresh_failed" | "role_check_failed" };

const OWNER_EMAIL = "info@digiformation.uk";

export const isOwnerEmail = (email?: string | null) =>
  email?.toLowerCase() === OWNER_EMAIL;

/**
 * Get the current session WITHOUT proactively calling refreshSession().
 *
 * The Supabase client is configured with `autoRefreshToken: true`, which
 * already refreshes the token in the background well before expiry. Calling
 * refreshSession() manually here was creating a feedback loop:
 *   recoverSession -> refreshSession -> TOKEN_REFRESHED event ->
 *   listeners call recoverSession again -> 429 rate limit -> revoked token
 *   -> forced logout.
 *
 * We only force a refresh if the token has ALREADY expired (very rare,
 * usually after the device wakes from sleep with a long backgrounded tab).
 */
export const recoverSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  const session = data.session;
  if (!session) return { session: null, error: null };

  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  // Only refresh if actually expired — autoRefreshToken handles the rest.
  if (expiresAt > 0 && expiresAt <= Date.now()) {
    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session) {
      return { session: refreshed.data.session, error: null };
    }
    return { session: null, error: refreshed.error };
  }

  return { session, error: null };
};

/**
 * Returns the user from the local session when possible (no network),
 * falling back to getUser() only if the session has no embedded user.
 * Avoids hammering /auth/v1/user on every visibility / focus event.
 */
export const getReliableUser = async () => {
  const { session, error } = await recoverSession();
  if (error || !session) return { user: null, error };
  if (session.user) return { user: session.user, error: null };

  const { data, error: userError } = await supabase.auth.getUser();
  return { user: data.user ?? null, error: userError };
};

export const checkAdminSession = async (): Promise<AdminSessionResult> => {
  const { user, error } = await getReliableUser();
  if (!user) {
    return { ok: false, reason: error ? "refresh_failed" : "signed_out" };
  }

  if (isOwnerEmail(user.email)) return { ok: true, user, isAdmin: true };

  const { data, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) return { ok: false, reason: "role_check_failed" };
  if (!data) return { ok: false, reason: "not_admin" };

  return { ok: true, user, isAdmin: true };
};
