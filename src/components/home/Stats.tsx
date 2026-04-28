import { Globe, Clock, Users, Award } from "lucide-react";

const stats = [
  { value: "500+", label: "Companies Registered", icon: Globe },
  { value: "48h", label: "Average Formation Time", icon: Clock },
  { value: "30+", label: "Banking & Payment Partners", icon: Award },
  { value: "60+", label: "Countries Served", icon: Users },
];

const Stats = () => (
  <section className="py-24 relative">
    <div className="container px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="glass-card glass-card-hover p-8 text-center">
            <s.icon className="w-7 h-7 mx-auto text-gold mb-4 stroke-[1.4]" />
            <div className="font-display text-5xl font-semibold gradient-text-gold leading-none mb-2">{s.value}</div>
            <div className="font-utility text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
