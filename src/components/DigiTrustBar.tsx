const partners = [
  "Companies House", "IRS", "Stripe", "PayPal", "Wise", "Payoneer",
  "Tide", "Sunrate", "WorldFirst", "eBay", "Shopify", "Airwallex",
  "Zionpe", "Wallester",
];

const DigiTrustBar = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-20 border-y border-border/60 bg-secondary/20 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em]">Trusted Partners & Official Integrations</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex gap-6 animate-partner-slide" style={{ width: "max-content" }}>
          {loop.map((name, i) => (
            <div key={i} className="logo-card">
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
