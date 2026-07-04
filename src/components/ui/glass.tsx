import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Frosted glass card with layered depth — the base container used everywhere. */
export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("glass-card p-4", className)} {...p} />
  ),
);
GlassCard.displayName = "GlassCard";

/** Compact stat tile — tile-numeric values. */
export function StatTile({
  label, value, delta, tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "bull" | "bear" | "neutral";
}) {
  const toneClass =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-neutral";
  return (
    <GlassCard className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-neutral/80 truncate">{label}</div>
      <div className="tabular mt-1 text-xl font-semibold leading-tight truncate">{value}</div>
      {delta && <div className={cn("tabular mt-0.5 text-xs", toneClass)}>{delta}</div>}
    </GlassCard>
  );
}

/** Section heading row. */
export function SectionTitle({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/** Sentinel label component — semantic status pill. */
export function Pill({
  children, tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "bull" | "bear" | "neutral" | "cyan";
}) {
  const toneClass = {
    bull:    "bg-bull/15  text-bull  border-bull/30",
    bear:    "bg-bear/15  text-bear  border-bear/30",
    neutral: "bg-neutral/15 text-neutral border-neutral/30",
    cyan:    "bg-cyan/15  text-cyan  border-cyan/30",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", toneClass)}>
      {children}
    </span>
  );
}
