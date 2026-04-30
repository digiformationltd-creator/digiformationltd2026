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

      {/* Lightweight empty strip — logos will be added here */}
      <div className="trust-strip" aria-hidden="true" />
    </section>
  );
};

export default DigiTrustBar;
