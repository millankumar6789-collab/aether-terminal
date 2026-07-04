import Link from "next/link";
import { GlassCard, StatTile, SectionTitle, Pill } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * LANDING → redirect to /dashboard
 * The root page is a server component that delegates to the dashboard route.
 * ────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="text-center py-10">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-cyan">⌖ Aether Terminal</span>
        </h1>
        <p className="mt-2 text-sm text-neutral">
          Institutional-grade trading platform — mobile-first, cloud-native.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link href="/dashboard" className="rounded-xl bg-cyan/20 border border-cyan/40 px-4 py-3 text-sm font-semibold text-cyan">
            → Markets
          </Link>
          <Link href="/strategies" className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold">
            → Strategies
          </Link>
        </div>
        <p className="mt-6 text-[11px] text-neutral/70">
          Phase 1 foundation shell · Supabase Auth ready · Vercel-ready
        </p>
      </GlassCard>

      {/* Feature ribbon — quick proof of layout density on 360px */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="S&P 500" value="0.00" delta="awaiting feed" tone="neutral" />
        <StatTile label="BTC / USD" value="0.00" delta="awaiting feed" tone="neutral" />
      </div>

      <GlassCard>
        <SectionTitle title="Architecture status" />
        <div className="flex flex-wrap gap-2">
          <Pill tone="cyan">Next.js 16</Pill>
          <Pill tone="bull">Supabase SSR</Pill>
          <Pill tone="neutral">Framer Motion</Pill>
          <Pill tone="neutral">Tailwind v4</Pill>
          <Pill tone="bull">Mobile-first</Pill>
        </div>
        <p className="mt-3 text-xs text-neutral">
          Plug in <code className="text-cyan">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-cyan">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code>.env.local</code> to enable auth.
        </p>
      </GlassCard>
    </div>
  );
}
