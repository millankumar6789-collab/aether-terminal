import { GlassCard, Pill, SectionTitle } from "@/components/ui/glass";

/* ──────────────────────────────────────────────────────────────────────────
 * MODULE 6 — AI RESEARCH CENTER
 * Strategy review · portfolio review · risk analysis · market research.
 * Multi-model failover: DeepSeek → Qwen → NVIDIA NIM → fallback chain.
 * Phase 1 status: layout skeleton. Orchestration arrives in Phase 4.
 * ────────────────────────────────────────────────────────────────────────── */
const MODELS = [
  { name: "deepseek-v4-pro",          role: "Primary",    tone: "cyan" as const },
  { name: "qwen3-coder-480b",          role: "Secondary",  tone: "bull" as const },
  { name: "minimax-m3",              role: "Fallback",   tone: "neutral" as const },
  { name: "kimi-k2.6",               role: "Fallback",   tone: "neutral" as const },
  { name: "gemma-4-31b-it",           role: "Fallback",   tone: "neutral" as const },
  { name: "nemotron-3-ultra-550b",    role: "Fallback",   tone: "neutral" as const },
  { name: "llama-4-maverick-17b",     role: "Fallback",   tone: "neutral" as const },
];

const RESEARCH_ACTIONS = [
  { title: "Strategy Review",   glyph: "🔍" },
  { title: "Portfolio Review",  glyph: "💼" },
  { title: "Risk Analysis",     glyph: "⚠️" },
  { title: "Market Research",   glyph: "🌐" },
  { title: "Quant Research",     glyph: "🧮" },
];

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">AI Research Center</h1>
        <p className="text-xs text-neutral">Multi-model failover · 24/7 continuous market monitoring</p>
      </div>

      {/* Research action grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
        {RESEARCH_ACTIONS.map((a) => (
          <button
            key={a.title}
            className="glass-card flex flex-col items-center gap-1.5 p-4 text-center active:scale-95 transition-transform"
          >
            <span className="text-2xl">{a.glyph}</span>
            <span className="text-xs font-semibold">{a.title}</span>
          </button>
        ))}
      </div>

      {/* Model roster */}
      <GlassCard>
        <SectionTitle title="Model roster" action={<Pill tone="bull">failover enabled</Pill>} />
        <div className="space-y-2">
          {MODELS.map((m) => (
            <div key={m.name} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.name}</div>
              </div>
              <Pill tone={m.tone}>{m.role}</Pill>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="bg-cyan/5 border-cyan/20">
        <SectionTitle title="AI report output" />
        <p className="text-[11px] text-neutral leading-relaxed">
          Every AI output carries: confidence score, supporting evidence, model attribution,
          and timestamp. Multi-strategy consensus runs against all four analysis tiers
          (microstructure → institutional flow → quant → strategy validation).
        </p>
      </GlassCard>
    </div>
  );
}
