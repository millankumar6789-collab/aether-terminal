import { GlassCard, StatTile, Pill, SectionTitle } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 4 — PORTFOLIO CENTER
 * Holdings · risk · performance · allocation · exposure.
 * Phase 1 status: layout skeleton. Live PnL wire-in arrives in Phase 4.
 * ────────────────────────────────────────────────────────────────────────── */
const HOLDINGS = [
  { sym: "AAPL", qty: "0", mv: "—" },
  { sym: "BTC",  qty: "0", mv: "—" },
  { sym: "EURUSD", qty: "0", mv: "—" },
];

const RISK_METRICS = [
  { label: "VaR (95%)",   value: "—" },
  { label: "CVaR",        value: "—" },
  { label: "Volatility",  value: "—" },
  { label: "Max DD",      value: "—" },
  { label: "Beta",        value: "—" },
  { label: "Sharpe",      value: "—" },
];

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Portfolio Center</h1>
        <p className="text-xs text-neutral">Holdings · exposure · risk metrics · performance attribution</p>
      </div>

      {/* Equity summary tiles */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Equity"   value="$0.00"  delta="—" tone="neutral" />
        <StatTile label="Cash"     value="$0.00"  delta="—" tone="neutral" />
        <StatTile label="Open risk" value="0%"    delta="—" tone="neutral" />
        <StatTile label="Day PnL"  value="$0.00"  delta="—" tone="neutral" />
      </div>

      {/* Equity curve placeholder */}
      <GlassCard className="aspect-[2/1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl opacity-30">📊</div>
          <div className="mt-2 text-sm font-semibold">Equity Curve</div>
          <div className="text-[11px] text-neutral">Streams in once portfolio is connected to a broker / exchange</div>
        </div>
      </GlassCard>

      {/* Holdings list */}
      <GlassCard>
        <SectionTitle title="Holdings" />
        <div className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-wide text-neutral">
          <div>Symbol</div><div>Qty</div><div className="text-right">Market value</div>
        </div>
        <div className="mt-2 space-y-1.5">
          {HOLDINGS.map((h) => (
            <div key={h.sym} className="grid grid-cols-3 text-sm tabular">
              <div>{h.sym}</div>
              <div className="text-neutral">{h.qty}</div>
              <div className="text-right">{h.mv}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Risk metrics grid */}
      <GlassCard>
        <SectionTitle title="Risk metrics" action={<Pill tone="cyan">institutional</Pill>} />
        <div className="grid grid-cols-3 gap-2">
          {RISK_METRICS.map((m) => (
            <div key={m.label} className="rounded-lg bg-white/5 p-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral">{m.label}</div>
              <div className="tabular text-sm font-semibold mt-0.5">{m.value}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
