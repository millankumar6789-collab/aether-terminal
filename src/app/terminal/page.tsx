import { GlassCard, Pill } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 2 — TRADING TERMINAL
 * TradingView / KLineCharts integration stub + timeframe selector.
 * Phase 1 status: layout skeleton. TradingView widget mounts in Phase 2.
 * ────────────────────────────────────────────────────────────────────────── */
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M"] as const;
const SYMBOLS = ["BTCUSD", "EURUSD", "XAUUSD", "NAS100", "AAPL", "ETHUSD"];

export default function TerminalPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Trading Terminal</h1>
        <p className="text-xs text-neutral">Multi-chart layout · drawing tools · full timeframe matrix</p>
      </div>

      {/* Symbol chips */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 no-scrollbar">
        {SYMBOLS.map((s, i) => (
          <button
            key={s}
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold " +
              (i === 0
                ? "border-cyan/40 bg-cyan/15 text-cyan"
                : "border-white/10 bg-white/5 text-neutral")
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chart placeholder — TradingView widget mounts here in Phase 2 */}
      <GlassCard className="aspect-[4/3] flex flex-col items-center justify-center">
        <div className="text-4xl opacity-40">📈</div>
        <div className="mt-2 text-sm font-semibold">Chart Surface</div>
        <div className="mt-1 text-[11px] text-neutral text-center px-4">
          TradingView lightweight-charts / KLineCharts Pro will mount here.
          Mobile viewport keeps candle density readable at 360px.
        </div>
      </GlassCard>

      {/* Timeframe selector — horizontal scroll-free wrapping grid */}
      <GlassCard>
        <div className="grid grid-cols-4 gap-2">
          {TIMEFRAMES.map((tf, i) => (
            <button
              key={tf}
              className={
                "rounded-lg py-2 text-xs font-semibold tabular " +
                (i === 5
                  ? "bg-cyan/15 text-cyan border border-cyan/30"
                  : "bg-white/5 text-neutral border border-white/10")
              }
            >
              {tf}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        <Pill tone="cyan">Drawing tools</Pill>
        <Pill tone="neutral">DOM</Pill>
        <Pill tone="neutral">Footprint</Pill>
        <Pill tone="bull">Order book</Pill>
      </div>
    </div>
  );
}
