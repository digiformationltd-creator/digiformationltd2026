// Premium grayscale shimmer skeletons for Business OS.
// Linear/Stripe/Vercel-style: subtle, lightweight, no layout shift.
// Respects prefers-reduced-motion via .os-skel CSS rule.

import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Shimmer({ className, ...rest }: DivProps) {
  return <div className={cn("os-skel rounded-md", className)} {...rest} />;
}

/* KPI grid (Dashboard) */
export function KpiGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="os-glass p-5">
          <div className="flex items-start justify-between">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="w-9 h-9 rounded-lg" />
          </div>
          <Shimmer className="mt-4 h-7 w-24" />
          <Shimmer className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/* Chart placeholder */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("os-glass p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="h-4 w-40" />
        <Shimmer className="h-3 w-20" />
      </div>
      <div className="h-64 flex items-end gap-2 px-1">
        {[55, 80, 40, 65, 90, 50, 75, 60].map((h, i) => (
          <Shimmer key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function DonutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("os-glass p-5", className)}>
      <Shimmer className="h-4 w-32 mb-4" />
      <div className="h-64 grid place-items-center">
        <div className="relative w-40 h-40">
          <Shimmer className="absolute inset-0 rounded-full" />
          <div className="absolute inset-6 rounded-full bg-[hsl(var(--os-bg))]" />
        </div>
      </div>
    </div>
  );
}

/* List / activity panels */
export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("os-glass p-5", className)}>
      <Shimmer className="h-4 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="space-y-2 flex-1">
              <Shimmer className="h-3 w-1/2" />
              <Shimmer className="h-2.5 w-1/3" />
            </div>
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Generic table skeleton (desktop) + card list (mobile) */
export function TableSkeleton({
  columns = 6,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {/* Desktop */}
      <div className="os-glass overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="py-3 px-4">
                    <Shimmer className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-b border-white/5 last:border-0">
                  {Array.from({ length: columns }).map((_, c) => (
                    <td key={c} className="py-3.5 px-4">
                      <Shimmer
                        className="h-3"
                        style={{ width: `${40 + ((r * 13 + c * 17) % 50)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="os-glass p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <Shimmer className="h-3.5 w-2/5" />
              <Shimmer className="h-5 w-14 rounded-full" />
            </div>
            <Shimmer className="h-3 w-3/5" />
            <Shimmer className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </>
  );
}

/* Lead pipeline (Kanban) skeleton */
export function PipelineSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="w-[280px] shrink-0 os-glass p-3">
          <div className="flex items-center justify-between mb-3">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 + ((c + 1) % 3) }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-2">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2.5 w-1/2" />
                <div className="flex justify-between pt-1">
                  <Shimmer className="h-2.5 w-1/3" />
                  <Shimmer className="h-2.5 w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
