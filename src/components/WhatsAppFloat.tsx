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
  if (pathname !== "/") return null;
  const text = encodeURIComponent(buildMessage(pathname));

  return (
    <a
      href={`https://wa.me/923164467464?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick("floating_button")}
      aria-label="Chat with us on WhatsApp"
      className="hide-on-nav-open fixed bottom-5 right-5 z-50 group flex items-center justify-center bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-transform w-14 h-14 sm:w-16 sm:h-16"
    >
      {/* Official WhatsApp glyph */}
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 sm:w-8 sm:h-8"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.045 2.247v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.83 3.41 4.823 4.31.616.287 2.108.888 2.788.888.817 0 2.535-.515 2.535-1.79 0-.13 0-.244-.03-.372-.058-.144-2.23-1.202-2.83-1.202zm-2.95 7.376a8.696 8.696 0 0 1-4.42-1.205l-3.155.81.84-3.069c-.802-1.341-1.225-2.876-1.225-4.45 0-4.806 3.965-8.7 8.834-8.7 2.366 0 4.6.926 6.275 2.566a8.553 8.553 0 0 1 2.6 6.135c-.001 4.8-3.967 8.913-8.749 8.913zM22.45 9.39a10.434 10.434 0 0 0-7.435-3.061c-5.79 0-10.515 4.681-10.515 10.43 0 1.834.487 3.634 1.412 5.214L4 27.317l5.46-1.425a10.585 10.585 0 0 0 5.05 1.282h.005c5.79 0 10.485-4.682 10.485-10.43 0-2.792-1.105-5.41-3.084-7.385h.534z" />
      </svg>
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366]"></span>
      </span>
    </a>
  );
};

export default WhatsAppFloat;
