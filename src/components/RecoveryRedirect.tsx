import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global guard for Supabase password-recovery links.
 *
 * When a user clicks the reset-password email link, Supabase places a
 * recovery session in the URL hash (#access_token=...&type=recovery&...).
 * If they land on any page other than /reset-password, we must:
 *   1. Detect the recovery hash on first paint and route to /reset-password
 *      (preserving the hash so the Supabase client can pick up the session).
 *   2. Listen for the PASSWORD_RECOVERY auth event (fired when the client
 *      parses the hash) and redirect to /reset-password regardless of where
 *      the user currently is.
 *
 * This prevents Auth.tsx / Dashboard.tsx auth listeners from sending the
 * recovery session straight to the dashboard.
 */
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hash check runs on every route change
  useEffect(() => {
    const hash = window.location.hash || "";
    const isRecoveryHash = /[#&?]type=recovery(&|$)/.test(hash);
    if (isRecoveryHash && location.pathname !== "/reset-password") {
      navigate("/reset-password" + hash, { replace: true });
    }
  }, [location.pathname, navigate]);

  // Auth event listener mounted ONCE (avoid recreating on every route change)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return null;
};

export default RecoveryRedirect;
