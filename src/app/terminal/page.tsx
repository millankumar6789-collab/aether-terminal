"use client";

import { useState, useCallback, useEffect } from "react";
import { GlassCard, Pill } from "@/components/ui/glass";
import { createChart, ColorType } from "lightweight-charts";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 2 — TRADING TERMINAL (Direct chart — no lazy load)
 *
 * lightweight-charts imported STATICALLY — chart renders immediately.
 * All chart logic inlined here. No dynamic import, no barrel, no lazy load.
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

const TRADINGVIEW_INTERVAL: Record<string, string> = {
  "1m": "1", "5m": "5", "15m": "15", "1h": "60",
  "4h": "240", "1D": "1d", "1W": "1w", "1M": "1M",
};

function InlineChart({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "error" | "live">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;

    (async () => {
      try {
        // 1. Create chart
        const chart = createChart(container, {
          width: container.clientWidth,
          height: 420,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#94a3b8",
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.04)" },
            horzLines: { color: "rgba(255,255,255,0.04)" },
          },
          crosshair: { mode: 0 },
          timeScale: {
            borderColor: "rgba(255,255,255,0.06)",
            timeVisible: true,
          },
        });

        if (!active) { chart.remove(); return; }

        // 2. Add candlestick series
        const series = (chart as any).addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderDownColor: "#ef4444",
          borderUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          wickUpColor: "#22c55e",
        });

        // 3. Fetch initial candles
        const tf = TRADINGVIEW_INTERVAL[timeframe] || "1h";
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${tf}&limit=100`
        );
        const raw = await res.json();
        
        if (!Array.isArray(raw) || !raw.length) {
          if (active) { setStatus("error"); setErrorMsg("No candle data"); chart.remove(); }
          return;
        }

        const data = raw.map((k: any[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        if (active) {
          series.setData(data);
          chart.timeScale().fitContent();
          setStatus("live");
        }

        // 4. WebSocket for live updates
        const ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol}@kline_${tf}`
        );
        ws.onmessage = (e) => {
          if (!active) return;
          try {
            const msg = JSON.parse(e.data);
            if (msg?.e !== "kline") return;
            const k = msg.k;
            series.update({
              time: Math.floor(k.t / 1000),
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            });
          } catch {}
        };

        // Cleanup
        return () => {
          active = false;
          ws.close();
          chart.remove();
        };
      } catch (err: any) {
        if (active) {
          setStatus("error");
          setErrorMsg(err?.message || "Chart init failed");
        }
      }
    })();

    // Resize handler
    const onResize = () => {
      const c = containerRef.current;
      if (c) {
        // chart resize handled by lightweight-charts internally
      }
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); };
  }, [symbol, timeframe]);

  return (
    <div className="relative">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 z-10 rounded-xl">
          <div className="text-center">
            <div className="text-4xl opacity-40">📈</div>
            <div className="mt-2 text-sm font-semibold">Loading chart…</div>
            <div className="text-[11px] text-neutral mt-1">
              Fetching {symbol.toUpperCase()} candles…
            </div>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center justify-center" style={{height:420}}>
          <div className="text-center">
            <div className="text-sm text-bear">Chart error</div>
            <div className="text-[11px] text-neutral mt-1 max-w-[280px]">{errorMsg}</div>
          </div>
        </div>
      )}
      {status === "live" && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] text-green-400 bg-ink-950/80 rounded-full px-2 py-0.5">
            ● Live
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: status === "error" ? 420 : undefined, minHeight: status === "loading" ? 420 : undefined }}
      />
    </div>
  );
}

export default function TerminalPage() {
  const [symbol, setSymbol] = useState("btcusdt");
  const [timeframe, setTimeframe] = useState("1D");

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
            onClick={() => setSymbol(s.id)}
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

      {/* Live Chart — inlined, no lazy load */}
      <GlassCard className="overflow-hidden p-0">
        <InlineChart symbol={symbol} timeframe={timeframe} />
      </GlassCard>

      {/* Timeframe selector */}
      <GlassCard>
        <div className="grid grid-cols-4 xs:grid-cols-7 gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
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