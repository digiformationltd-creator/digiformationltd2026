import {
  Building2,
  Landmark,
  CreditCard,
  Wallet,
  Globe,
  Banknote,
  ShieldCheck,
  Briefcase,
  DollarSign,
  Coins,
  CircleDollarSign,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

type Partner = { name: string; icon: LucideIcon };

const partners: Partner[] = [
  { name: "Stripe", icon: CreditCard },
  { name: "PayPal", icon: Wallet },
  { name: "Wise", icon: Globe },
  { name: "Payoneer", icon: Banknote },
  { name: "Airwallex", icon: CircleDollarSign },
  { name: "Tide", icon: Briefcase },
  { name: "WorldFirst", icon: DollarSign },
  { name: "Sunrate", icon: Coins },
  { name: "Wallester", icon: BadgeCheck },
  { name: "Companies House", icon: Building2 },
  { name: "HMRC", icon: ShieldCheck },
  { name: "IRS", icon: Landmark },
];

// Duplicate for seamless marquee loop
const loop = [...partners, ...partners];

const DigiTrustBar = () => {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-4 mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="h-px w-7 bg-primary" />
          <span className="text-xs uppercase tracking-[0.18em] font-semibold">Trusted Network</span>
          <span className="h-px w-7 bg-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Trusted Partners &amp; <em className="not-italic text-gradient">Official Integrations</em>
        </h2>
      </div>

      {/* Edge fades */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="trust-marquee">
          <div className="trust-track">
            {loop.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="trust-card glass border border-border/30"
              >
                <p.icon className="w-7 h-7 text-primary shrink-0" aria-hidden="true" />
                <span className="font-display text-sm font-semibold tracking-wide whitespace-nowrap">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
