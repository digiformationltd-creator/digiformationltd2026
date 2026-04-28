import { partners } from "@/data/navigation";

const PartnersBar = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-20 border-y border-gold/10 bg-surface/30 relative overflow-hidden">
      <div className="container px-4 mb-10 text-center">
        <div className="eyebrow justify-center mb-3">Trusted Partners</div>
        <h2 className="font-display text-3xl md:text-4xl font-light">
          Official Integrations & <em className="font-semibold gradient-text-gold not-italic">Verified Partners</em>
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="marquee-track py-4">
          {loop.map((name, i) => (
            <div key={i} className="logo-plate">
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersBar;
