import { supabase } from "@/integrations/supabase/client";

export const trackWhatsAppClick = async (source: string) => {
  try {
    await supabase.from("whatsapp_clicks").insert({
      source: source.slice(0, 100),
      page_path: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : null,
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 1000) : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  } catch {
    // Silent fail — don't block the redirect
  }
};
