import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { trackWhatsAppClick } from "@/lib/analytics";

// Map URL path patterns → friendly pre-filled WhatsApp message.
const buildMessage = (pathname: string): string => {
  const p = pathname.toLowerCase();
  let topic = "your services";
  if (p.includes("uk-ltd") || p.includes("uk-services")) topic = "UK LTD company formation";
  else if (p.includes("us-llc") || p.includes("usa-services")) topic = "US LLC company formation";
  else if (p.includes("banks") || p.includes("payment")) topic = "banking & payment account setup";
  else if (p.includes("compliance") || p.includes("annual")) topic = "UK compliance & annual filing";
  else if (p.includes("web-development")) topic = "web development services";
  else if (p.includes("pricing")) topic = "your pricing & packages";
  else if (p.includes("blog/")) topic = "the article I'm reading on your blog";

  return `Hello Digiformation, I'd like to know more about ${topic}. (sent from ${pathname})`;
};

const WhatsAppFloat = () => {
  const { pathname } = useLocation();
  const text = encodeURIComponent(buildMessage(pathname));

  return (
    <a
      href={`https://wa.me/923164467464?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick("floating_button")}
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 group flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-105 transition-transform p-4 sm:p-4"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      <span className="hidden sm:inline font-semibold pr-1">Chat on WhatsApp</span>
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366]"></span>
      </span>
    </a>
  );
};

export default WhatsAppFloat;
