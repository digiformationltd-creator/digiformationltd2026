import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ServiceIcon, { ServiceIconName } from "@/components/icons/ServiceIcons";
import { glassTintFor, inferGlassCategory } from "@/lib/glassCategory";

export type RelatedItem = {
  name: string;
  path: string;
  description?: string;
  icon?: ServiceIconName;
};

type Props = {
  title?: string;
  eyebrow?: string;
  items: RelatedItem[];
  className?: string;
};

const RelatedServices = ({ title = "Related Services", eyebrow = "Explore More", items, className }: Props) => (
  <section className={`py-12 md:py-16 border-t border-border/60 ${className ?? ""}`}>
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.18em] font-semibold opacity-70 mb-2">{eyebrow}</div>
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((r) => (
          <Link
            key={r.path}
            to={r.path}
            className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group flex flex-col"
          >
            {r.icon && (
              <div className="mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-transparent grid place-items-center">
                <ServiceIcon name={r.icon} size={36} />
              </div>
            )}
            <h3 className="font-semibold text-lg group-hover:text-gradient">{r.name}</h3>
            {r.description && <p className="text-sm opacity-75 mt-2 leading-relaxed flex-1">{r.description}</p>}
            <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-primary">
              Explore <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default RelatedServices;
