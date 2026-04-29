import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/921644674644"
      target="_blank"
      rel="noopener noreferrer"
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
