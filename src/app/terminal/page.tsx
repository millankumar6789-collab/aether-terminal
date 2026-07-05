"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { GlassCard, Pill } from "@/components/ui/glass";

// Dynamic import — lightweight-charts is browser-only (canvas)
const LiveChart = dynamic(() => import("@/components/charts/live-chart"), {
  ssr: false,
  loading: () => (
    <GlassCard className="aspect-[4/3] flex flex-col items-center justify-center">
      <div className="text-sm text-neutral">Loading chart…</div>
    </GlassCard>
  ),
});

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 2 — TRADING TERMINAL (Live edition)
 *
 * TradingView Lightweight Charts powered by Binance WebSocket.
 * Symbol selector switches pairs live. Timeframe selector re-fetches candles.
 * Mobile-first — single chart view at 360px, thumb-zone controls.
 * ────────────────────────────────────────────────────────────────────────── */

const SYMBOLS = [
  { id: "btcusdt",    label: "BTC/USD" },
  { id: "ethusdt",    label: "ETH/USD" },
  { id: "solusdt",    label: "SOL/USD" },
  { id: "bnbusdt",     label: "BNB/USD" },
  { id: "xrpusdt",     label: "XRP/USD" },
  { id: "adausdt",     label: "ADA/USD" },
];

const TIMEFRAMES = [
  { id: "1m",  label: "1m" },
  { id: "5m",  label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h",  label: "1h" },
  { id: "4h",  label: "4h" },
  { id: "1D",  label: "1D" },
  { id: "1W",  label: "1W" },
] as const;

export default function TerminalPage() {
  const [symbol, setSymbol] = useState("btcusdt");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartKey, setChartKey] = useState(0); // force remount on tf change

  const handleSymbolChange = useCallback((s: string) => {
    setSymbol(s);
    // Re-mount chart to fetch new symbol data + new WS stream
    setChartKey((k) => k + 1);
  }, []);

  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    // Re-mount chart with new interval
    setChartKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-lg font-bold tracking-tight">Trading Terminal</h1>
        <p className="text-xs text-neutral">
          Real-time charts · Binance WebSocket · tap to switch symbols
        </p>
      </div>

      {/* ── Symbol selector chips ── */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 no-scrollbar">
        {SYMBOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSymbolChange(s.id)}
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
              (s.id === symbol
                ? "border-cyan/40 bg-cyan/15 text-cyan"
                : "border-white/10 bg-white/5 text-neutral hover:bg-white/10")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Live Chart ── */}
      <GlassCard className="overflow-hidden p-0">
        <LiveChart
          key={chartKey}
          symbol={symbol}
          timeframe={timeframe}
          height={420}
        />
      </GlassCard>

      {/* ── Timeframe selector ── */}
      <GlassCard>
        <div className="grid grid-cols-4 xs:grid-cols-7 gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => handleTimeframeChange(tf.id)}
              className={
                "rounded-lg py-2 text-xs font-semibold tabular transition-colors " +
                (tf.id === timeframe
                  ? "bg-cyan/15 text-cyan border border-cyan/30"
                  : "bg-white/5 text-neutral border border-white/10 hover:bg-white/10")
              }
            >
              {tf.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Tool indicators ── */}
      <div className="flex flex-wrap gap-2">
        <Pill tone="cyan">Drawing tools</Pill>
        <Pill tone="neutral">DOM</Pill>
        <Pill tone="neutral">Footprint</Pill>
        <Pill tone="bull">Order book</Pill>
      </div>

      <p className="text-center text-[10px] text-green-400/80">
        ● Live Binance data · TradingView Lightweight Charts · Phase 3 real-time
      </p>
    </div>
  );
}