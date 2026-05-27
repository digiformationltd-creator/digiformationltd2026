import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminSessionResult =
  | { ok: true; user: User; isAdmin: true }
  | { ok: false; reason: "signed_out" | "not_admin" | "refresh_failed" | "role_check_failed" };

const OWNER_EMAIL = "info@digiformation.uk";
const SETTLE_DELAY_MS = 250;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const isOwnerEmail = (email?: string | null) =>
  email?.toLowerCase() === OWNER_EMAIL;

export const recoverSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };

  if (!data.session) {
    await wait(SETTLE_DELAY_MS);
    const retry = await supabase.auth.getSession();
    return { session: retry.data.session ?? null, error: retry.error ?? null };
  }

  const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
  const refreshSoon = expiresAt > 0 && expiresAt - Date.now() < 5 * 60 * 1000;

  if (refreshSoon) {
    const refreshed = await supabase.auth.refreshSession(data.session);
    if (!refreshed.error && refreshed.data.session) {
      return { session: refreshed.data.session, error: null };
    }
  }

  return { session: data.session, error: null };
};

export const getReliableUser = async () => {
  const { session, error } = await recoverSession();
  if (error || !session) return { user: null, error };

  const { data, error: userError } = await supabase.auth.getUser();
  if (!userError && data.user) return { user: data.user, error: null };

  await wait(SETTLE_DELAY_MS);
  const retry = await supabase.auth.getUser();
  return { user: retry.data.user ?? null, error: retry.error ?? userError };
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
