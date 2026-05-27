import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminSession } from "@/lib/auth/session";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles.css";

export default function BusinessOSLayout() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const result = await checkAdminSession();
      if (!mounted) return;
      if (result.ok) {
        setAllowed(true);
        setReady(true);
        return;
      }

      if ("reason" in result && (result.reason === "refresh_failed" || result.reason === "role_check_failed")) {
        setReady(true);
        return;
      }

      setAllowed(false);
      setReady(true);
      navigate("reason" in result && result.reason === "not_admin" ? "/dashboard" : "/auth", { replace: true });
    };

    verify();

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.setTimeout(verify, 0);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        window.setTimeout(verify, 0);
      }
    });

    const onForeground = () => {
      if (document.visibilityState === "visible") verify();
    };

    const onFocus = () => verify();
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onFocus);
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
