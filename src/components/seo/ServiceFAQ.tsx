import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type FAQ = { q: string; a: string };

type Props = {
  /** Unique id used for the JSON-LD <script> so multiple FAQ blocks don't collide. */
  id: string;
  title?: string;
  eyebrow?: string;
  faqs: FAQ[];
  className?: string;
};

/**
 * Accessible FAQ accordion that auto-emits FAQPage JSON-LD into <head>.
 * Drop one per page. JSON-LD is cleaned up on unmount/route change.
 */
const ServiceFAQ = ({ id, title = "Frequently Asked Questions", eyebrow, faqs, className }: Props) => {
  useEffect(() => {
    const scriptId = `ldjson-faq-${id}`;
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = scriptId;
      document.head.appendChild(el);
    }
    el.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [id, faqs]);

  return (
    <section className={`py-12 md:py-16 bg-muted/20 border-t border-border/60 ${className ?? ""}`}>
      <div className="container mx-auto px-4 max-w-3xl">
        {eyebrow && (
          <div className="text-center text-xs uppercase tracking-[0.18em] font-semibold opacity-70 mb-3">{eyebrow}</div>
        )}
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">{title}</h2>
        <Accordion type="single" collapsible className="glass rounded-2xl px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${id}-${i}`} className="border-border/40">
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="opacity-90 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default ServiceFAQ;
