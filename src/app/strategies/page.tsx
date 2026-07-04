"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard, Pill, SectionTitle } from "@/components/ui/glass";
import { FileCode2, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FORMATS = [
  "Pine Script", "MQL4", "MQL5", "Python", "TXT", "Markdown", "JSON", "YAML",
];

type Strategy = {
  id: string;
  name: string;
  market?: string;
  timeframe?: string;
  strategy_type: string;
  created_at: string;
  status?: string;
  strategy_definition?: any;
};

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 3 — STRATEGY WORKSPACE (Phase 2 — live API-backed)
 *
 * Upload → Parse → Registry → Detail with real /api/strategies endpoints.
 * Gracefully degrades when Supabase env is placeholder — shows empty state
 * with upload prompt.
 * ────────────────────────────────────────────────────────────────────────── */
export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [selected, setSelected] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);

  // ── Fetch strategies from /api/strategies ──
  const fetchStrategies = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/strategies");
      const json = await res.json();
      if (json.strategies && Array.isArray(json.strategies)) {
        setStrategies(json.strategies);
        setApiAvailable(true);
      } else if (json.error && !json.error.includes("could not find")) {
        // API exists but Supabase not wired — graceful
        setApiAvailable(true);
        setStrategies([]);
      }
    } catch {
      setApiAvailable(false);
      setStrategies([]);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // ── Handle file upload ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setMessage("");

    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/strategies", {
          method: "POST",
          body: form,
        });
        const json = await res.json();

        if (res.ok) {
          setMessage(`✅ "${file.name}" uploaded — parsed as ${json.strategy.strategy_type}`);
          setMessageType("success");
          fetchStrategies();
        } else {
          setMessage(`❌ "${file.name}": ${json.error || "upload failed"}`);
          setMessageType("error");
        }
      } catch {
        setMessage(`❌ "${file.name}": network error`);
        setMessageType("error");
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  // ── Selected strategy detail ──
  const detail = strategies.find((s) => s.id === selected);
  const def = detail?.strategy_definition as Record<string, any> | undefined;

  // ── Strategy type counts ──
  const typeCounts: Record<string, number> = {};
  for (const s of strategies) {
    typeCounts[s.strategy_type] = (typeCounts[s.strategy_type] || 0) + 1;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Strategy Workspace
          </h1>
          <p className="text-xs text-neutral">
            {strategies.length
              ? `${strategies.length} strategies in registry`
              : apiAvailable
              ? "Upload your first strategy to start"
              : "API ready — wire Supabase env vars to persist"}
          </p>
        </div>
        <button
          onClick={fetchStrategies}
          disabled={fetching}
          className="glass-card p-2"
          aria-label="Refresh strategies"
        >
          <RefreshCw
            size={16}
            className={cn("text-neutral", fetching && "animate-spin")}
          />
        </button>
      </div>

      {/* ── Upload dropzone ── */}
      <GlassCard className="border-dashed border-cyan/30">
        <label
          className="flex flex-col items-center justify-center text-center cursor-pointer py-8"
          aria-busy={uploading}
        >
          {uploading ? (
            <RefreshCw className="text-cyan animate-spin" size={28} />
          ) : (
            <Upload className="text-cyan" size={28} />
          )}
          <div className="mt-2 text-sm font-semibold">
            {uploading ? "Uploading…" : "Upload strategy"}
          </div>
          <div className="mt-1 text-[11px] text-neutral">
            Pine · MQL4/5 · Python · JSON · YAML · TXT · MD
          </div>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pine,.mq4,.mq5,.py,.txt,.md,.json,.yaml,.yml"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </GlassCard>

      {/* ── Status message ── */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm border",
            messageType === "success"
              ? "bg-bull/10 border-bull/30 text-bull"
              : "bg-bear/10 border-bear/30 text-bear"
          )}
        >
          <AlertCircle size={14} />
          {message}
        </div>
      )}

      {/* ── Supported formats ── */}
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Pill key={f} tone="neutral">
            {f}
          </Pill>
        ))}
      </div>

      {/* ── Strategy registry ── */}
      <GlassCard>
        <SectionTitle
          title="Registry"
          action={
            <Pill tone={strategies.length ? "bull" : "neutral"}>
              {strategies.length} strategies
            </Pill>
          }
        />
        {strategies.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral">
            {apiAvailable
              ? "No strategies yet — upload your first Pine/MQL/Python file above"
              : "Strategy API ready. Supabase not wired — strategies won't persist until env vars are set."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  setSelected(selected === s.id ? null : s.id)
                }
                className={cn(
                  "w-full flex items-center justify-between rounded-lg p-2.5 text-left transition-colors",
                  selected === s.id
                    ? "bg-cyan/10 border border-cyan/30"
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode2
                    size={16}
                    className={cn(
                      "shrink-0",
                      selected === s.id ? "text-cyan" : "text-neutral"
                    )}
                  />
                  <span className="text-sm truncate">{s.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Pill tone="cyan">{s.strategy_type}</Pill>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Type breakdown ── */}
      {Object.keys(typeCounts).length > 0 && (
        <GlassCard>
          <SectionTitle title="Type Breakdown" />
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(typeCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5"
                >
                  <span className="text-xs">{type}</span>
                  <span className="tabular text-xs text-neutral">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </GlassCard>
      )}

      {/* ── Selected strategy detail ── */}
      {detail && (
        <GlassCard className="border-cyan/20">
          <SectionTitle
            title={detail.name}
            action={<Pill tone="cyan">{detail.strategy_type}</Pill>}
          />
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {detail.market && (
              <div>
                <span className="text-neutral uppercase tracking-wide">
                  Market
                </span>
                <div className="font-semibold mt-0.5">{detail.market}</div>
              </div>
            )}
            {detail.timeframe && (
              <div>
                <span className="text-neutral uppercase tracking-wide">
                  Timeframe
                </span>
                <div className="font-semibold mt-0.5">
                  {detail.timeframe}
                </div>
              </div>
            )}
            <div>
              <span className="text-neutral uppercase tracking-wide">
                Added
              </span>
              <div className="font-semibold mt-0.5 tabular">
                {new Date(detail.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-neutral uppercase tracking-wide">
                Status
              </span>
              <div className="font-semibold mt-0.5">
                {detail.status || "Active"}
              </div>
            </div>
          </div>

          {/* Entry / Exit conditions from parsed definition */}
          {def?.entry_conditions && (
            <div className="mb-2">
              <span className="text-neutral text-[10px] uppercase tracking-wide">
                Entry conditions
              </span>
              <ul className="mt-1 space-y-0.5">
                {(def.entry_conditions as string[]).map(
                  (c: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs bg-bull/10 border border-bull/20 rounded px-2 py-0.5 text-bull"
                    >
                      {c}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          {def?.exit_conditions && (
            <div>
              <span className="text-neutral text-[10px] uppercase tracking-wide">
                Exit conditions
              </span>
              <ul className="mt-1 space-y-0.5">
                {(def.exit_conditions as string[]).map(
                  (c: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs bg-bear/10 border border-bear/20 rounded px-2 py-0.5 text-bear"
                    >
                      {c}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Footer ── */}
      <p className="text-center text-[10px] text-neutral/60">
        Phase 2 strategy engine · Pine/MQL/Python parsers ·{" "}
        {apiAvailable
          ? "API live, Supabase pending"
          : "API pending — deploy to Vercel"}
      </p>
    </div>
  );
}