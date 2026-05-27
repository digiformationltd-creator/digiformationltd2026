import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminSession } from "@/lib/auth/session";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles.css";

/**
 * Re-verification policy (stability-critical):
 *
 * - Verify ONCE on mount.
 * - Listen to onAuthStateChange but ONLY act on SIGNED_OUT. Reacting to
 *   TOKEN_REFRESHED / USER_UPDATED / SIGNED_IN here used to call verify()
 *   which called recoverSession() which called refreshSession() — the
 *   resulting feedback loop hit the auth /token endpoint until it 429'd
 *   and the user was forcibly logged out.
 * - Re-verify on visibilitychange (tab/app returning to foreground), but
 *   throttled to once every 60s so a quick blur/focus cycle on mobile
 *   cannot stampede the auth server.
 * - No "focus" listener — mobile browsers fire it constantly and it
 *   overlaps with visibilitychange.
 */
export default function BusinessOSLayout() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const wasAllowedRef = useRef(false);
  const lastCheckRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      lastCheckRef.current = Date.now();
      const result = await checkAdminSession();
      if (!mounted) return;
      if (result.ok === true) {
        wasAllowedRef.current = true;
        setAllowed(true);
        setReady(true);
        return;
      }

      const reason = result.reason;
      // Transient failures (network/refresh) should NOT log out a user who
      // was previously authorized. Keep them on the page; the next interaction
      // will retry. Only redirect on explicit signed_out / not_admin.
      if (
        wasAllowedRef.current &&
        (reason === "refresh_failed" || reason === "role_check_failed")
      ) {
        setReady(true);
        return;
      }

      setAllowed(false);
      setReady(true);
      navigate(reason === "not_admin" ? "/dashboard" : "/auth", { replace: true });
    };

    verify();

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      // ONLY react to explicit sign-outs. Do NOT re-run verify on
      // TOKEN_REFRESHED / SIGNED_IN / USER_UPDATED — those create loops
      // and the autoRefreshToken mechanism keeps the session valid for us.
      if (event === "SIGNED_OUT") {
        wasAllowedRef.current = false;
        setAllowed(false);
        navigate("/auth", { replace: true });
      }
    });

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      // Throttle: at most one re-verify per minute.
      if (Date.now() - lastCheckRef.current < 60_000) return;
      verify();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="businessos grid place-items-center min-h-screen">
        <div className="text-white/50 text-sm">Loading Business OS…</div>
      </div>
    );
  }
  if (!allowed) return null;

  return (
    <div className="businessos flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
