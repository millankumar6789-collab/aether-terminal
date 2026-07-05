"use client";

import { createChart, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
import { useEffect, useRef, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * LiveChart — TradingView Lightweight Charts with Binance WebSocket feed.
 *
 * Props:
 *   symbol    Binance pair (e.g. "btcusdt", "ethusdt")
 *   timeframe Kline interval (1m, 5m, 15m, 1h, 4h, 1d, 1w)
 *   height    px height (default 400)
 *
 * Features:
 *   - Dark glassmorphism theme matching Aether design system
 *   - Real-time Binance WebSocket kline updates
 *   - Restores historical candles from REST API on mount
 *   - Mobile-optimized — touch pan/zoom, readable at 360px
 *   - Cleanup on unmount (closes WebSocket, removes chart)
 * ────────────────────────────────────────────────────────────────────────── */

type Props = {
  symbol: string;   // lowercase binance pair, e.g. "btcusdt"
  timeframe: string; // Binance interval string
  height?: number;
};

export default function LiveChart({ symbol, timeframe, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  // Keep refs in sync
  symbolRef.current = symbol;
  timeframeRef.current = timeframe;

  const TRADINGVIEW_INTERVAL: Record<string, string> = {
    "1m": "1", "5m": "5", "15m": "15", "1h": "60",
    "4h": "240", "1D": "1d", "1W": "1w", "1M": "1M",
  };

  // ── Fetch initial candles from Binance REST ──
  const fetchInitial = useCallback(async (sym: string, tf: string) => {
    const binanceTF = TRADINGVIEW_INTERVAL[tf] || "1h";
    const limit = tf === "1m" ? 200 : tf === "5m" ? 200 : 100;
    const url = `https://api.binance.com/api/v3/klines?symbol=${sym.toUpperCase()}&interval=${binanceTF}&limit=${limit}`;

    try {
      const res = await fetch(url);
      const raw: any[] = await res.json();
      if (!Array.isArray(raw)) return [];

      return raw.map((k) => ({
        time: Math.floor(k[0] / 1000) as Time, // Binance ms → seconds
        open:  parseFloat(k[1]),
        high:  parseFloat(k[2]),
        low:   parseFloat(k[3]),
        close: parseFloat(k[4]),
      })) as CandlestickData[];
    } catch {
      return [];
    }
  }, []);

  // ── Connect Binance WebSocket for live kline updates ──
  const connectWS = useCallback(
    (sym: string, tf: string, series: ISeriesApi<"Candlestick">) => {
      // Close existing
      if (wsRef.current) {
        wsRef.current.close();
      }

      const binanceTF = TRADINGVIEW_INTERVAL[tf] || "1h";
      const stream = `${sym}@kline_${binanceTF}`;
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg?.e !== "kline") return;
          const k = msg.k;
          if (!k?.t) return;

          const time = Math.floor(k.t / 1000) as Time;
          const bar: CandlestickData = {
            time,
            open:  parseFloat(k.o),
            high:  parseFloat(k.h),
            low:   parseFloat(k.l),
            close: parseFloat(k.c),
          };

          series.update(bar);
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => { /* silently reconnect handled by cleanup */ };
      wsRef.current = ws;
    },
    []
  );

  // ── Main effect: create chart, load data, start WS ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    (async () => {
      // 1. Create chart with dark glassmorphism theme
      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: "rgba(34,211,238,0.3)",
            labelBackgroundColor: "rgba(34,211,238,0.9)",
          },
          horzLine: {
            color: "rgba(34,211,238,0.3)",
            labelBackgroundColor: "rgba(34,211,238,0.9)",
          },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
        },
        handleScroll: { vertTouchDrag: false },
      });
      chartRef.current = chart;

      if (!active) { chart.remove(); return; }

      // 2. Add candlestick series (deprecated in v5 types but working API)
      const series = (chart as any).addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        wickUpColor: "#22c55e",
      });
      seriesRef.current = series;

      // 3. Fetch initial candles
      const data = await fetchInitial(symbolRef.current, timeframeRef.current);
      if (data.length && active) {
        series.setData(data);
        chart.timeScale().fitContent();
      }

      // 4. Connect WebSocket for live updates
      connectWS(symbolRef.current, timeframeRef.current, series);
    })();

    // Resize handler
    const onResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      active = false;
      window.removeEventListener("resize", onResize);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      seriesRef.current = null;
    };
  }, [symbol, timeframe, height, fetchInitial, connectWS]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height }}
    />
  );
}