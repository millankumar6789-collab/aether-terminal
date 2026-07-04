import Link from "next/link";
import { GlassCard } from "@/components/ui/glass";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
      <div className="text-6xl opacity-30">⌖</div>
      <GlassCard className="text-center max-w-sm">
        <h1 className="text-xl font-bold">404 — Off the chart</h1>
        <p className="mt-2 text-sm text-neutral">
          That route doesn't exist. Sweep back to the dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-xl bg-cyan/20 border border-cyan/40 px-4 py-2 text-sm font-semibold text-cyan"
        >
          → Markets
        </Link>
      </GlassCard>
    </div>
  );
}
