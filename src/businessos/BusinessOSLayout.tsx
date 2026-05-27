import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles.css";

export default function BusinessOSLayout() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = (roles || []).some((r: any) => r.role === "admin");
      if (!mounted) return;
      if (!isAdmin) { navigate("/dashboard"); return; }
      setAllowed(true); setReady(true);
    })();
    return () => { mounted = false; };
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
