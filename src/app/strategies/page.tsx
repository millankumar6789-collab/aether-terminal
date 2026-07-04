import { GlassCard, Pill, SectionTitle } from "@/components/ui/glass";
import { FileCode2, Upload } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 3 — STRATEGY WORKSPACE
 * Upload · Parse · Analyze · Backtest · Optimize.
 * Asset-bounded execution enforced downstream.
 * Phase 1 status: upload UI scaffold. Parsing pipeline arrives in Phase 2.
 * ────────────────────────────────────────────────────────────────────────── */

const STRATEGY_TYPES = [
  { type: "Scalping",    count: 0 },
  { type: "Day Trading", count: 0 },
  { type: "Swing",       count: 0 },
  { type: "Position",    count: 0 },
  { type: "Quant",       count: 0 },
  { type: "SMC/ICT",     count: 0 },
  { type: "Hybrid",      count: 0 },
];

const FORMATS = ["Pine Script", "MQL4", "MQL5", "Python", "TXT", "Markdown", "JSON", "YAML", "PDF"];

export default function StrategiesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Strategy Workspace</h1>
        <p className="text-xs text-neutral">Ingest · parse · convert to unified format · asset-bounded execution</p>
      </div>

      {/* Upload dropzone */}
      <GlassCard className="border-dashed border-cyan/30">
        <label className="flex flex-col items-center justify-center text-center cursor-pointer py-8">
          <Upload className="text-cyan" size={28} />
          <div className="mt-2 text-sm font-semibold">Upload strategy</div>
          <div className="mt-1 text-[11px] text-neutral">
            Pine · MQL4/5 · Python · JSON · YAML · TXT · MD · PDF
          </div>
          <input type="file" multiple className="hidden" accept=".pine,.mq4,.mq5,.py,.txt,.md,.json,.yaml,.yml,.pdf" />
        </label>
      </GlassCard>

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Pill key={f} tone="neutral">{f}</Pill>
        ))}
      </div>

      {/* Strategy registry table placeholder */}
      <GlassCard>
        <SectionTitle title="Registry" action={<Pill tone="cyan">0 strategies</Pill>} />
        <div className="space-y-2">
          {STRATEGY_TYPES.map((s) => (
            <div key={s.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 size={16} className="text-neutral" />
                <span className="text-sm">{s.type}</span>
              </div>
              <span className="tabular text-xs text-neutral">{s.count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <p className="text-center text-[10px] text-neutral/60">
        Multi-strategy consensus engine · asset isolation · backtest runner arrive in Phase 2-3.
      </p>
    </div>
  );
}
