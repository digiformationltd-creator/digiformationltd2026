const stats = [
  { value: "120+", label: "Enterprise clients" },
  { value: "$2.4B", label: "Revenue influenced" },
  { value: "98%", label: "Retention rate" },
  { value: "14", label: "Global markets" },
];

const DigiStats = () => (
  <section className="py-24 border-y border-border bg-secondary/30">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {stats.map((s, i) => (
          <div key={s.label} className={`text-center md:text-left ${i > 0 ? "md:border-l md:border-border md:pl-10" : ""}`}>
            <div className="text-4xl md:text-6xl font-bold text-gradient font-display mb-2">{s.value}</div>
            <div className="text-xs uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default DigiStats;
