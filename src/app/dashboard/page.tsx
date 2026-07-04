import { GlassCard, StatTile, SectionTitle, Pill } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 1 — MARKET OVERVIEW
 * Heatmaps, gainer/loser, most active, watchlists, sector performance.
 * Phase 1 status: skeleton wired. Live heatmaps arrive in Phase 5 (order flow).
 * ────────────────────────────────────────────────────────────────────────── */
const GAINERS = [
  { sym: "AAPL", chg: "+1.34%" },
  { sym: "NVDA", chg: "+2.07%" },
  { sym: "MSFT", chg: "+0.88%" },
];
const LOSERS = [
  { sym: "META", chg: "-0.91%" },
  { sym: "TSLA", chg: "-1.42%" },
  { sym: "AMZN", chg: "-0.57%" },
];
const CRYPTO = [
  { sym: "BTC", chg: "+0.62%", tone: "bull" as const },
  { sym: "ETH", chg: "-0.18%", tone: "bear" as const },
  { sym: "SOL", chg: "+3.04%", tone: "bull" as const },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Market Overview</h1>
        <p className="text-xs text-neutral">Real-time heatmap & gainer/loser · live feed pending</p>
      </div>

      {/* Top indices row — 2-up grid on 360px, 4-up on ≥480px */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatTile label="NASDAQ" value="--" delta="—" tone="neutral" />
        <StatTile label="S&P 500" value="--" delta="—" tone="neutral" />
        <StatTile label="DAX" value="--" delta="—" tone="neutral" />
        <StatTile label="EUR/USD" value="--" delta="—" tone="neutral" />
        <StatTile label="XAU/USD" value="--" delta="—" tone="neutral" />
        <StatTile label="WTI" value="--" delta="—" tone="neutral" />
      </div>

      {/* Gainer / Loser split */}
      <div className="grid grid-cols-2 gap-2">
        <GlassCard>
          <SectionTitle title={<span className="text-bull">Gainers</span>} />
          <ul className="space-y-1.5">
            {GAINERS.map((g) => (
              <li key={g.sym} className="flex items-center justify-between">
                <span className="tabular text-sm font-medium">{g.sym}</span>
                <Pill tone="bull">{g.chg}</Pill>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <SectionTitle title={<span className="text-bear">Losers</span>} />
          <ul className="space-y-1.5">
            {LOSERS.map((l) => (
              <li key={l.sym} className="flex items-center justify-between">
                <span className="tabular text-sm font-medium">{l.sym}</span>
                <Pill tone="bear">{l.chg}</Pill>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {/* Crypto strip */}
      <GlassCard>
        <SectionTitle title="Crypto / Most Active" />
        <div className="flex flex-wrap gap-2">
          {CRYPTO.map((c) => (
            <div key={c.sym} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
              <span className="tabular text-sm font-semibold">{c.sym}/USD</span>
              <Pill tone={c.tone}>{c.chg}</Pill>
            </div>
          ))}
        </div>
      </GlassCard>

      <p className="text-center text-[10px] text-neutral/60">
        Heatmaps · order flow · liquidity maps arrive in Phase 5.
      </p>
    </div>
  );
}
