"use client";

import { GlassCard, StatTile, SectionTitle, Pill } from "@/components/ui/glass";
import { useBinanceTicker, formatPrice, priceTone } from "@/hooks/use-binance-ticker";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 1 — MARKET OVERVIEW (Live edition)
 * Real-time Binance spot prices + live gainer/loser.
 * ────────────────────────────────────────────────────────────────────────── */

const CRYPTO_SYMBOLS = [
  "btcusdt", "ethusdt", "solusdt", "bnbusdt",
  "xrpusdt", "adausdt", "dogeusdt", "avaxusdt",
];

export default function DashboardPage() {
  const { tickers, connected } = useBinanceTicker({
    symbols: CRYPTO_SYMBOLS,
  });

  const btc = tickers.get("btcusdt");
  const eth = tickers.get("ethusdt");
  const sol = tickers.get("solusdt");
  const bnb = tickers.get("bnbusdt");
  const xrp = tickers.get("xrpusdt");
  const ada = tickers.get("adausdt");
  const doge = tickers.get("dogeusdt");
  const avax = tickers.get("avaxusdt");

  // Build gainer/loser from live data
  const all = Array.from(tickers.values()).filter((t) => t.change24hPct !== 0);
  const sorted = [...all].sort((a, b) => b.change24hPct - a.change24hPct);
  const gainers = sorted.filter((t) => t.change24hPct > 0).slice(0, 3);
  const losers = sorted.filter((t) => t.change24hPct < 0).reverse().slice(0, 3);
  const active = sorted.slice(0, 5);

  const hasLiveData = tickers.size > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Market Overview</h1>
        <p className="text-xs text-neutral">
          Real-time Binance ticker · Crypto spot markets
          {connected && (
            <span className="text-green-400 ml-1">● Live</span>
          )}
          {!connected && !hasLiveData && (
            <span className="text-neutral/60 ml-1">· connecting…</span>
          )}
        </p>
      </div>

      {/* ── CRYPTO TILES (primary — live data) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {btc ? (
          <StatTile
            label="BTC / USD"
            value={formatPrice("btcusdt", btc.price)}
            delta={`${btc.change24hPct >= 0 ? "+" : ""}${btc.change24hPct.toFixed(2)}%`}
            tone={priceTone(btc.change24hPct)}
          />
        ) : (
          <StatTile label="BTC / USD" value="..." delta="loading" tone="neutral" />
        )}
        {eth ? (
          <StatTile
            label="ETH / USD"
            value={formatPrice("ethusdt", eth.price)}
            delta={`${eth.change24hPct >= 0 ? "+" : ""}${eth.change24hPct.toFixed(2)}%`}
            tone={priceTone(eth.change24hPct)}
          />
        ) : (
          <StatTile label="ETH / USD" value="..." delta="loading" tone="neutral" />
        )}
        {sol ? (
          <StatTile
            label="SOL / USD"
            value={formatPrice("solusdt", sol.price)}
            delta={`${sol.change24hPct >= 0 ? "+" : ""}${sol.change24hPct.toFixed(2)}%`}
            tone={priceTone(sol.change24hPct)}
          />
        ) : (
          <StatTile label="SOL / USD" value="..." delta="loading" tone="neutral" />
        )}
        {bnb && (
          <StatTile
            label="BNB / USD"
            value={formatPrice("bnbusdt", bnb.price)}
            delta={`${bnb.change24hPct >= 0 ? "+" : ""}${bnb.change24hPct.toFixed(2)}%`}
            tone={priceTone(bnb.change24hPct)}
          />
        )}
        {xrp && (
          <StatTile
            label="XRP / USD"
            value={formatPrice("xrpusdt", xrp.price)}
            delta={`${xrp.change24hPct >= 0 ? "+" : ""}${xrp.change24hPct.toFixed(2)}%`}
            tone={priceTone(xrp.change24hPct)}
          />
        )}
        {ada && (
          <StatTile
            label="ADA / USD"
            value={formatPrice("adausdt", ada.price)}
            delta={`${ada.change24hPct >= 0 ? "+" : ""}${ada.change24hPct.toFixed(2)}%`}
            tone={priceTone(ada.change24hPct)}
          />
        )}
      </div>

      {/* ── Gainer / Loser ── */}
      {gainers.length > 0 && losers.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <GlassCard>
            <SectionTitle
              title={<span className="text-bull">Gainers</span>}
            />
            <ul className="space-y-1.5">
              {gainers.map((g) => (
                <li
                  key={g.symbol}
                  className="flex items-center justify-between"
                >
                  <span className="tabular text-sm font-medium">
                    {g.symbol.replace("USDT", "")}
                  </span>
                  <Pill tone="bull">+{g.change24hPct.toFixed(2)}%</Pill>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard>
            <SectionTitle
              title={<span className="text-bear">Losers</span>}
            />
            <ul className="space-y-1.5">
              {losers.map((g) => (
                <li
                  key={g.symbol}
                  className="flex items-center justify-between"
                >
                  <span className="tabular text-sm font-medium">
                    {g.symbol.replace("USDT", "")}
                  </span>
                  <Pill tone="bear">{g.change24hPct.toFixed(2)}%</Pill>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {/* ── Most Active ── */}
      {active.length > 0 && (
        <GlassCard>
          <SectionTitle title="Most Active" />
          <div className="flex flex-wrap gap-2">
            {active.map((c) => (
              <div
                key={c.symbol}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5"
              >
                <span className="tabular text-sm font-semibold">
                  {c.symbol.replace("USDT", "")}/USD
                </span>
                <span className="tabular text-xs font-semibold text-neutral">
                  {formatPrice(c.symbol.toLowerCase(), c.price)}
                </span>
                <Pill tone={priceTone(c.change24hPct)}>
                  {c.change24hPct >= 0 ? "+" : ""}
                  {c.change24hPct.toFixed(2)}%
                </Pill>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Indices (static — needs API keys) ── */}
      <GlassCard>
        <SectionTitle title="Indices & Forex" action={
          <Pill tone="neutral">needs API key</Pill>
        } />
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div><span className="text-neutral">NASDAQ</span><div>--</div></div>
          <div><span className="text-neutral">S&P 500</span><div>--</div></div>
          <div><span className="text-neutral">DAX</span><div>--</div></div>
          <div><span className="text-neutral">EUR/USD</span><div>--</div></div>
          <div><span className="text-neutral">XAU/USD</span><div>--</div></div>
          <div><span className="text-neutral">WTI</span><div>--</div></div>
        </div>
      </GlassCard>

      {/* ── Architecture ── */}
      <GlassCard>
        <SectionTitle title="Architecture" />
        <div className="flex flex-wrap gap-2">
          <Pill tone="cyan">Next.js 16</Pill>
          <Pill tone="bull">Supabase SSR</Pill>
          <Pill tone="bull">TradingView Charts</Pill>
          <Pill tone="cyan">Binance WS</Pill>
          <Pill tone="neutral">Tailwind v4</Pill>
          <Pill tone="bull">Mobile-first</Pill>
        </div>
        <p className="mt-3 text-xs text-neutral">
          Live crypto via Binance public WebSocket. Stock indices need
          Polygon or Alpaca API keys in <code className="text-cyan">.env.local</code>.
        </p>
      </GlassCard>
    </div>
  );
}