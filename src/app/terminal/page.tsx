"use client";

import { useState, useCallback, useEffect } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { loadChart } from "@/components/charts";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 2 — TRADING TERMINAL (Preload chart)
 *
 * Barrel import loadChart() forces Turbopack bundling.
 * ChartShell preloads immediately on mount, no lazy evaluation.
 * ────────────────────────────────────────────────────────────────────────── */

const SYMBOLS = [
  { id: "btcusdt",  label: "BTC/USD" },
  { id: "ethusdt",  label: "ETH/USD" },
  { id: "solusdt",  label: "SOL/USD" },
  { id: "bnbusdt",   label: "BNB/USD" },
  { id: "xrpusdt",   label: "XRP/USD" },
  { id: "adausdt",   label: "ADA/USD" },
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

function ChartShell({ symbol, timeframe, chartKey }: {
  symbol: string;
  timeframe: string;
  chartKey: number;
}) {
  const [state, setState] = useState<{ ChartComp?: any; error?: string }>({});

  useEffect(() => {
    let cancelled = false;
    // Load on mount, preload before render
    loadChart()
      .then((mod) => {
        if (!cancelled) setState({ ChartComp: mod.default });
      })
      .catch((e: any) => {
        if (!cancelled) setState({ error: e?.message || "Chart load failed" });
      });
    return () => { cancelled = true; };
  }, []);

  if (state.error) {
    return (
      <GlassCard className="flex flex-col items-center justify-center" style={{minHeight:300}}>
        <div className="text-sm text-bear">Chart failed to load</div>
        <div className="text-[11px] text-neutral mt-1 text-center px-4 max-w-[300px]">
          {state.error}
        </div>
        <button
          onClick={() => { setState({}); }}
          className="mt-4 rounded-xl bg-cyan/20 border border-cyan/40 px-4 py-2 text-sm font-semibold text-cyan"
        >
          Retry
        </button>
      </GlassCard>
    );
  }

  if (!state.ChartComp) {
    return (
      <GlassCard className="flex flex-col items-center justify-center" style={{minHeight:300}}>
        <div className="text-4xl opacity-40">📈</div>
        <div className="mt-2 text-sm font-semibold">Loading chart…</div>
        <div className="text-[11px] text-neutral mt-1">
          {symbol.toUpperCase()} {timeframe}
        </div>
      </GlassCard>
    );
  }

  const Chart = state.ChartComp;
  return (
    <GlassCard className="overflow-hidden p-0">
      <Chart key={chartKey} symbol={symbol} timeframe={timeframe} height={420} />
    </GlassCard>
  );
}

export default function TerminalPage() {
  const [symbol, setSymbol] = useState("btcusdt");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartKey, setChartKey] = useState(0);

  const handleSymbolChange = useCallback((s: string) => {
    setSymbol(s);
    setChartKey((k) => k + 1);
  }, []);

  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    setChartKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Trading Terminal</h1>
        <p className="text-xs text-neutral">
          Real-time charts · Binance WebSocket · tap to switch symbols
        </p>
      </div>

      {/* Symbol selector */}
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

      {/* Live Chart */}
      <ChartShell symbol={symbol} timeframe={timeframe} chartKey={chartKey} />

      {/* Timeframe selector */}
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

      <div className="flex flex-wrap gap-2">
        <Pill tone="cyan">Drawing tools</Pill>
        <Pill tone="neutral">DOM</Pill>
        <Pill tone="neutral">Footprint</Pill>
        <Pill tone="bull">Order book</Pill>
      </div>

      <p className="text-center text-[10px] text-green-400/80">
        ● Live Binance data · TradingView Lightweight Charts
      </p>
    </div>
  );
}