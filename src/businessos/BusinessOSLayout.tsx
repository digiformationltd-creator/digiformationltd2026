import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminSession } from "@/lib/auth/session";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import OsErrorBoundary from "./ErrorBoundary";
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
  const location = useLocation();

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
      // Narrow to the failure branch.
      const failure = result as Extract<typeof result, { ok: false }>;
      const reason = failure.reason;

      // Transient failures (network/refresh) should NOT log out a user who
      // was previously authorized. Keep them on the page; the next interaction
      // will retry. Only redirect on explicit signed_out / not_admin.
      if (
        wasAllowedRef.current &&
        (reason === "refresh_failed" || reason === "role_check_failed")
      ) {
        setAllowed(true);
        setReady(true);
        return;
      }

      setAllowed(false);
      setReady(true);
      navigate(reason === "not_admin" ? "/dashboard" : "/auth", { replace: true });
    };

    verify();

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      // SIGNED_OUT can fire spuriously when the refresh-token endpoint is
      // rate-limited (429) or when a cross-tab storage event races a refresh.
      // Verify the session is REALLY gone (with a brief retry) before kicking
      // the user out — prevents desktop forced-logout during refresh storms.
      if (event === "SIGNED_OUT") {
        // 3-stage debounce across ~6s — autoRefreshToken often restores the
        // session after a transient refresh-storm / 429. Only redirect if the
        // session is still gone at the end of the window.
        const delays = [500, 2000, 4000];
        (async () => {
          for (const d of delays) {
            await new Promise((r) => setTimeout(r, d));
            const { data } = await supabase.auth.getSession();
            if (data.session) return;
          }
          wasAllowedRef.current = false;
          setAllowed(false);
          navigate("/auth", { replace: true });
        })();
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
    <div className="businessos flex min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main key={location.pathname} className="p-4 sm:p-6 flex-1 min-w-0 os-fade-in">
          <OsErrorBoundary routeKey={location.pathname}>
            <Outlet />
          </OsErrorBoundary>
        </main>
      </div>
    </div>
  );
}
