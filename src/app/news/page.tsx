import { GlassCard, Pill, SectionTitle } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 5 — NEWS INTELLIGENCE CENTER
 * Breaking news · smart money · insider filings · earnings · econ calendar.
 * Public institutional activity tracking ONLY. No non-public data, ever.
 * Phase 1 status: layout skeleton. Feed wiring arrives in Phase 4.
 * ────────────────────────────────────────────────────────────────────────── */
const FEEDS = [
  { title: "Breaking News Feed",           glyph: "📰" },
  { title: "Institutional Activity Feed",  glyph: "🏛️" },
  { title: "Insider Filing Feed",          glyph: "📋" },
  { title: "Earnings Calendar",            glyph: "📈" },
  { title: "Economic Calendar",            glyph: "🌐" },
  { title: "Smart Money Tracker",          glyph: "🧠" },
  { title: "Sector Rotation Dashboard",    glyph: "🔄" },
  { title: "AI News Intelligence Panel",   glyph: "✨" },
];

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">News Intelligence</h1>
        <p className="text-xs text-neutral">
          Public institutional activity only · SEC filings · Finviz · central banks
        </p>
      </div>

      <GlassCard className="bg-bear/5 border-bear/20">
        <div className="flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-[11px] leading-relaxed text-neutral">
            This module ingests <strong className="text-ink-100">public</strong> data only —
            Form 13F, Form 4, fund disclosures, exchange announcements. No non-public,
            confidential, or insider information is requested, processed, or displayed.
          </p>
        </div>
      </GlassCard>

      {/* Feed grid — 1 col @360px, 2 col @≥480px */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
        {FEEDS.map((f) => (
          <GlassCard key={f.title} className="flex items-center gap-3 min-h-[72px]">
            <span className="text-2xl">{f.glyph}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{f.title}</div>
              <div className="text-[11px] text-neutral">awaiting feed connection</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill tone="cyan">Finviz</Pill>
        <Pill tone="neutral">SEC EDGAR</Pill>
        <Pill tone="bull">13F</Pill>
        <Pill tone="neutral">Form 4</Pill>
        <Pill tone="neutral">Earnings</Pill>
      </div>
    </div>
  );
}
