import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const COOKIE_NAME = "df_ref";
const COOKIE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
}

export function getRefCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Mounted once at the app root. Captures ?ref= and logs an affiliate click. */
const RefCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const cleaned = ref.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
    if (cleaned.length < 3) return;

    const prev = getRefCookie();
    setCookie(COOKIE_NAME, cleaned, COOKIE_DAYS);

    // Only log a click if this is a new ref or a fresh visit (avoid spamming on every route change)
    const sessionKey = `df_ref_logged_${cleaned}`;
    if (prev !== cleaned || !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      supabase
        .from("affiliate_clicks")
        .insert({
          ref_code: cleaned,
          page_path: location.pathname + location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.slice(0, 500),
        })
        .then(() => {});
    }
  }, [location.pathname, location.search]);

  return null;
};

export default RefCapture;
