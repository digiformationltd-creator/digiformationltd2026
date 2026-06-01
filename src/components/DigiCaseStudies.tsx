import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Clock, BadgeCheck, UserCheck } from "lucide-react";

/**
 * "Verify Your Identity for Your UK Ltd" section.
 * Replaces the previous Case Studies block — keeps the same file name so the
 * existing import slot in Index.tsx continues to work.
 */
const DigiCaseStudies = () => (
  <section className="py-14 md:py-20 relative overflow-hidden border-y border-border/40">
    <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Copy */}
        <div data-reveal="rise">
          <div className="mb-4 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">
            Identity Verification
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Verify Your Identity for Your{" "}
            <em className="not-italic text-gradient">UK Ltd</em>
          </h2>
          <p className="mt-5 text-base md:text-lg opacity-80 max-w-xl">
            Companies House now requires every PSC, shareholder and director to
            complete identity verification. We handle the entire process for
            you — securely and in under 24 hours.
          </p>

          <ul className="mt-7 space-y-3 max-w-md">
            <li className="flex gap-3 text-sm md:text-base">
              <BadgeCheck className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Mandatory for PSCs, Shareholders & Directors</span>
            </li>
            <li className="flex gap-3 text-sm md:text-base">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Get verified in 24 hours</span>
            </li>
            <li className="flex gap-3 text-sm md:text-base">
              <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Companies House compliant — handled end-to-end</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/uk-services/ltd-id-verification"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-[0.12em] hover:shadow-elegant hover:-translate-y-0.5 transition-all"
            >
              Verify Now <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="text-sm">
              <span className="opacity-60">Only</span>{" "}
              <span className="text-2xl font-bold text-gradient align-middle">£20</span>
            </div>
          </div>
        </div>

        {/* Visual card */}
        <div data-reveal="rise" className="relative">
          <div className="glass glass-tint-teal rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] opacity-70">IDV Status</div>
                  <div className="font-semibold">Companies House Verified</div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Director", status: "Verified" },
                  { label: "PSC", status: "Verified" },
                  { label: "Shareholder", status: "Verified" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-background/40 border border-border/60 px-4 py-3"
                  >
                    <span className="text-sm">{row.label}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <BadgeCheck className="w-4 h-4" /> {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-6 border-t border-border/60 flex items-center justify-between text-xs uppercase tracking-[0.14em] opacity-80">
                <span>Turnaround</span>
                <span className="font-semibold text-foreground">24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DigiCaseStudies;
