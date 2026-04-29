import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, ExternalLink } from "lucide-react";

type Testimonial = {
  name: string;
  location?: string;
  quote: string;
  link: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Faizan Ahmed Yousafzai",
    location: "Pakistan",
    quote:
      "Excellent service with a strong commitment to quality and customer satisfaction. The company operates professionally, delivers on time, and maintains clear communication. Highly recommended.",
    link: "https://www.facebook.com/share/p/1DuGyxtRxE/",
  },
  {
    name: "Tahir Naveed",
    location: "Pakistan",
    quote: "Trusted and satisfied. Quick response and smooth communication.",
    link: "https://www.facebook.com/share/p/18FmasQ66x/",
  },
  {
    name: "TaiMoor Khan",
    location: "Pakistan",
    quote:
      "I had work with this guy and he is really professional. He knows how his work will be done and helped me out during the process. I would definitely recommend to others.",
    link: "https://www.facebook.com/share/p/17VsZCd2oj/",
  },
  {
    name: "Muhammad Hossain",
    location: "Pakistan",
    quote: "Detailed service and trusted platform.",
    link: "https://www.facebook.com/share/p/1Hv6PGqHVi/",
  },
  {
    name: "Muhammad Aora Khan",
    location: "Pakistan",
    quote: "The page owner provides services with great honesty and sincerity.",
    link: "https://www.facebook.com/share/p/1GxtxMAdgY/",
  },
];

const DigiTestimonials = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = testimonials.length;
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % total), 6000);
    return () => clearInterval(id);
  }, [paused, total]);

  const next = () => setActive((a) => (a + 1) % total);
  const prev = () => setActive((a) => (a - 1 + total) % total);

  return (
    <section className="py-14 md:py-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute -right-32 top-1/3 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Testimonials</span>
            <span className="h-px w-7 bg-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            What our <em className="not-italic text-gradient">clients say</em>
          </h2>
        </div>

        <div
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={trackRef}
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {testimonials.map((t) => (
                <div key={t.name} className="w-full flex-shrink-0 px-2">
                  <article className="glass rounded-2xl p-8 md:p-10 text-center">
                    <Quote className="w-8 h-8 mx-auto mb-5 opacity-60" />
                    <p className="text-base md:text-lg leading-relaxed mb-6 italic">
                      "{t.quote}"
                    </p>
                    <div className="font-display font-semibold text-lg">{t.name}</div>
                    {t.location && (
                      <div className="text-xs uppercase tracking-[0.16em] opacity-70 mt-1">{t.location}</div>
                    )}
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] px-4 py-2 rounded-full border border-primary/30 hover:bg-primary/10 transition"
                    >
                      View on Facebook <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </article>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-primary/25 grid place-items-center hover:text-primary hover:border-primary hover:bg-primary/5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-7 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-primary/25 grid place-items-center hover:text-primary hover:border-primary hover:bg-primary/5 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigiTestimonials;
