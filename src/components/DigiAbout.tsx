import { Link } from "react-router-dom";
import { Award, Building2, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import founderImg from "@/assets/founder-haroon.jpg";

const COMPANIES_HOUSE_URL =
  "https://find-and-update.company-information.service.gov.uk/officers/iIzC9R8zKXH6lyWTWCDaT3_gK4E/appointments";

const stats = [
  { icon: Building2, value: "71+", label: "UK Companies Registered Under His Name" },
  { icon: Award, value: "8+", label: "Years of Industry Experience" },
  { icon: ShieldCheck, value: "300+", label: "Clients Served Worldwide" },
];

const DigiAbout = () => (
  <section className="py-14 md:py-10 relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-[auto,1fr] gap-12 lg:gap-16 lg:items-start max-w-6xl mx-auto">
        {/* Founder portrait + stats below */}
        <div className="flex flex-col items-center lg:items-start lg:pt-2">
          <div className="relative mx-auto lg:mx-0">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl glass overflow-hidden group">
              <img
                src={founderImg}
                alt="Muhammad Haroon — Founder of Digiformation Ltd"
                className="w-full h-full object-cover object-top"
                loading="lazy"
                width={320}
                height={320}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -inset-px rounded-3xl border border-primary/20 pointer-events-none" />
            </div>
            {/* Floating credential chip — links to Companies House officer profile */}
            <a
              href={COMPANIES_HOUSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 shadow-elegant hover:scale-105 transition-transform group/badge"
              aria-label="View 71 UK company appointments on Companies House (opens in new tab)"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1">
                    Verified <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-xs font-semibold">Companies House · 71</div>
                </div>
              </div>
            </a>
          </div>

          {/* Stats below the picture — desktop view */}
          <div className="hidden lg:grid grid-cols-1 gap-3 w-full mt-10">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
                <s.icon className="w-5 h-5 opacity-80 flex-shrink-0" />
                <div>
                  <div className="text-xl font-bold text-gradient leading-none">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wider opacity-70 mt-1 leading-snug">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="text-center lg:text-left">
          <h2 data-reveal="rise" className="text-4xl md:text-5xl font-bold leading-[1.08] mb-3">
            Meet <em className="not-italic text-gradient">Muhammad Haroon</em>
          </h2>
          <p className="text-lg md:text-xl font-display opacity-90 mb-6">
            Founder &amp; Director of Digiformation Ltd — Director of <strong>71+ active UK companies</strong>.
          </p>

          <p className="text-base md:text-lg leading-relaxed opacity-90 mb-5">
            Muhammad Haroon is a UK company formation and compliance specialist who built Digiformation Ltd
            to make global business setup transparent, fast, and genuinely accessible to entrepreneurs
            across the world.
          </p>

          <p className="text-base leading-relaxed opacity-80 mb-6">
            With over <strong>71 active UK companies</strong> registered directly under his name with
            Companies House, and hundreds of international clients successfully launched in the UK and USA,
            Muhammad combines hands-on industry expertise with a personal commitment to every case
            Digiformation handles — from formation and banking to long-term compliance.
          </p>

          {/* Public verification link */}
          <a
            href={COMPANIES_HOUSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-8 px-4 py-2.5 rounded-full glass border border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all text-sm group/verify"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="opacity-90">
              Verify <strong>71 UK appointments</strong> on Companies House
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/verify:opacity-100 transition-opacity" />
          </a>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <Button asChild variant="hero" size="lg" className="rounded-full">
              <Link to="/blog/muhammad-haroon-founder-story-digiformation">
                Read Full Story <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
              <a
                href="https://wa.me/923164467464?text=Hi%20Digiformation%2C%20I%20want%20to%20get%20in%20touch%20about%20your%20services."
                target="_blank"
                rel="noopener noreferrer"
              >
                Get in Touch
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DigiAbout;
