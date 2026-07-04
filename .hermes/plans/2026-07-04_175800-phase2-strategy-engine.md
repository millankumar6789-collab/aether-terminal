# Aether Terminal — Phase 2: Strategy Engine Implementation Plan

> **For Hermes:** Use `delegate_task` to implement tasks in parallel where possible. Each task is ~2-5 min.
>
> **Goal:** Build strategy upload → parse → registry → signal generation pipeline with Supabase backend, enabling traders to ingest Pine/MQL/Python strategies and see live signals.
>
> **Architecture:** Next.js 16 + Supabase SSR (server actions + api routes) → PostgreSQL schema (already exists). Parsing via server-side Node.js + Python subprocess. Frontend renders strategy registry with live signals.
>
> **Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Supabase SSR/JS, shadcn/ui (add for form components), Zod (validation), Python 3.12 (Pine/MQL parsing), PostgreSQL (already deployed via supabase/schema.sql)

---

## Phase 2 Scope (from spec)

| Deliverable | Status |
|---|---|
| Strategy upload UI (dropzone → Supabase) | 🏗️ Build now |
| Pine Script parser → Unified Strategy Format (USF) | 🏗️ Build now |
| MQL4/MQL5 parser → USF | 🏗️ Build now |
| Python strategy validator → USF | 🏗️ Build now |
| JSON/YAML/MD strategy ingestion | 🏗️ Build now |
| Strategy registry (browse, filter, search, version) | 🏗️ Build now |
| Signal generation stub (placeholders, mock) | 🏗️ Build now |
| `/api/strategies` CRUD endpoint | 🏗️ Build now |
| `/api/health` endpoint | 🏗️ Build now |
| Supabase real-time signal subscription | 🏗️ Build now |

---

## Prep Tasks (do FIRST)

### Task 0a: Install missing dependencies

**Objective:** Add production deps needed for Phase 2

```bash
cd /root/trading-platform
npm install zod @supabase/supabase-js 2>&1 | tail -5
```

**Verify:** `npm ls zod @supabase/supabase-js` shows both installed

### Task 0b: Wire Supabase env vars

**Objective:** Ensure `.env.local` has real Supabase values (or proceed with placeholder guard)

**Current state:** All values are placeholders. The auth provider already guards against this.
For Phase 2 development, we proceed with placeholders and mock data — real Supabase connection comes when user provides keys.

**Verify:** `grep "placeholder" /root/trading-platform/.env.local` confirms placeholders (expected for now)

---

## Core Tasks

### Task 1: Create `/api/health` endpoint

**Objective:** Simple health check returning JSON with version + timestamp

**Files:**
- Create: `src/app/api/health/route.ts`

**Step 1: Write the endpoint**

```typescript
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "0.2.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

**Step 2: Verify**

```bash
curl -sS http://localhost:3000/api/health
# Expected: {"status":"healthy","version":"0.2.0","timestamp":"...","uptime":...}
```

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: add /api/health endpoint"
```

---

### Task 2: Create strategy Zod validation schemas

**Objective:** Define the Unified Strategy Format (USF) and upload validation schemas

**Files:**
- Create: `src/lib/validators/strategy.ts`

```typescript
import { z } from "zod";

export const STRATEGY_TYPES = [
  "SCALPING", "DAY", "SWING", "POSITION", "QUANT", "SMC", "ICT", "HYBRID"
] as const;

export const TIMEFRAMES = [
  "1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M"
] as const;

export const ASSET_CLASSES = [
  "EQUITY", "FOREX", "CRYPTO", "COMMODITY", "INDEX", "BOND"
] as const;

export const strategyUploadSchema = z.object({
  name: z.string().min(1).max(120),
  market: z.string().optional(),
  asset_class: z.enum(ASSET_CLASSES).optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  strategy_type: z.enum(STRATEGY_TYPES),
  source_file: z.string(), // base64 encoded file content
  file_type: z.enum(["PINE", "MQL4", "MQL5", "PYTHON", "TXT", "MD", "JSON", "YAML"]),
  file_name: z.string().min(1),
});

export type StrategyUpload = z.infer<typeof strategyUploadSchema>;

export const strategyDefSchema = z.object({
  name: z.string(),
  type: z.enum(STRATEGY_TYPES),
  market: z.string().optional(),
  asset_class: z.enum(ASSET_CLASSES).optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  entry_conditions: z.array(z.string()).optional(),
  exit_conditions: z.array(z.string()).optional(),
  risk_parameters: z.object({
    max_position_size_pct: z.number().min(0).max(100).optional(),
    stop_loss_pct: z.number().min(0).optional(),
    take_profit_pct: z.number().min(0).optional(),
    max_daily_loss_pct: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type StrategyDef = z.infer<typeof strategyDefSchema>;
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -5
# Expected: no errors from this file
```

**Step 3: Commit**

```bash
git add src/lib/validators/strategy.ts
git commit -m "feat: add strategy validation schemas (USF + upload)"
```

---

### Task 3: Create strategy parser (Pine + MQL + Python stub)

**Objective:** Server-side parser that converts source files to USF JSON

**Files:**
- Create: `src/lib/parsers/strategy-parser.ts`
- Create: `src/lib/parsers/pine-parser.ts`
- Create: `src/lib/parsers/mql-parser.ts`
- Create: `src/lib/parsers/python-parser.ts`

**`src/lib/parsers/strategy-parser.ts`** — main dispatcher:

```typescript
import { parsePine } from "./pine-parser";
import { parseMql } from "./mql-parser";
import { parsePython } from "./python-parser";
import type { StrategyDef } from "@/lib/validators/strategy";

export type ParseResult = {
  success: boolean;
  definition?: StrategyDef;
  error?: string;
  warnings?: string[];
};

export async function parseStrategy(
  content: string,
  file_type: string,
  file_name: string
): Promise<ParseResult> {
  const warnings: string[] = [];

  switch (file_type.toUpperCase()) {
    case "PINE":
      return { ...parsePine(content, file_name), warnings };
    case "MQL4":
    case "MQL5":
      return { ...parseMql(content, file_type), warnings };
    case "PYTHON":
      return { ...parsePython(content), warnings };
    case "JSON":
    case "YAML":
    case "MD":
    case "TXT":
      // Unstructured formats — extract metadata only
      return {
        success: true,
        definition: {
          name: file_name.replace(/\.[^.]+$/, ""),
          type: "HYBRID" as const,
          entry_conditions: ["(unstructured — manual review required)"],
          exit_conditions: ["(unstructured — manual review required)"],
        },
        warnings: ["Unstructured format — manual review recommended"],
      };
    default:
      return { success: false, error: `Unsupported format: ${file_type}` };
  }
}
```

**`src/lib/parsers/pine-parser.ts`** — Pine Script pattern extractor:

```typescript
import type { StrategyDef } from "@/lib/validators/strategy";

export function parsePine(
  content: string,
  file_name: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  const warnings: string[] = [];

  // Extract strategy name from comments or title
  const nameMatch =
    content.match(/\/\/\s*@version\s*=\s*\d+\s*\/\/\s*(.+)/) ||
    content.match(/\/\/\s*(?:Title|Strategy|Name):\s*(.+)/) ||
    content.match(/strategy\(["']([^"']+)["']/);

  const name = nameMatch?.[1]?.trim() || file_name.replace(/\.pine$/i, "");

  // Detect strategy type from Pine keywords
  const isSMC =
    /order[\s-]*block/i.test(content) ||
    /breaker/i.test(content) ||
    /bos\b/i.test(content) ||
    /fvg\b/i.test(content) ||
    /liquidity[\s-]*(?:void|sweep|grab)/i.test(content);

  const isICT =
    /kill[\s-]*zone/i.test(content) ||
    /optimal[\s-]*trade[\s-]*entry/i.test(content) ||
    /ote\b/i.test(content) ||
    /cte\b/i.test(content) ||
    /silver[\s-]*bullet/i.test(content);
  
  const type =
    isSMC || isICT ? "SMC" :
    /scalp/i.test(content) ? "SCALPING" :
    /swing/i.test(content) ? "SWING" :
    /position/i.test(content) ? "POSITION" :
    /quant/i.test(content) ? "QUANT" :
    "DAY";

  // Extract entry conditions from Pine patterns
  const entryPatterns = [
    ...(content.match(/(?:long|short)Condition\s*=\s*(.+?)(?:\n|$)/g) || []),
    ...(content.match(/strategy\.entry\([^,]+,\s*[^,]+,\s*(?:when\s*=\s*)?(.+?)\)/g) || []),
  ].map((p) => p.replace(/strategy\.entry\(/, "").replace(/longCondition\s*=/, "").replace(/shortCondition\s*=/, "").trim()).slice(0, 5);

  // Extract exit patterns
  const exitPatterns =
    content.match(/(?:strategy\.exit|strategy\.close)\(([^)]+?)\)/g) || [];

  return {
    success: true,
    definition: {
      name,
      type,
      market: content.match(/symbol\s*=\s*["']?([A-Z0-9/]+)["']?/)?.[1],
      timeframe: content.match(/timeframe\s*=\s*["']?(1[mhDW]|15m|4h)["']?/)?.[1],
      entry_conditions: entryPatterns.length
        ? entryPatterns
        : ["(extracted from Pine strategy entry calls)"],
      exit_conditions: exitPatterns.length
        ? exitPatterns.map((p) => p.trim())
        : ["(extracted from Pine strategy exit calls)"],
      risk_parameters: undefined, // Pine risk params need manual extraction
    },
  };
}
```

**`src/lib/parsers/mql-parser.ts`** — MQL4/MQL5 pattern extractor:

```typescript
import type { StrategyDef } from "@/lib/validators/strategy";

export function parseMql(
  content: string,
  file_type: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  const version = file_type === "MQL5" ? "MQL5" : "MQL4";

  // Extract name
  const nameMatch =
    content.match(/Expert\s+Name:\s*(.+)/) ||
    content.match(/class\s+(\w+)\s*(?:extends|:)/) ||
    content.match(/\/\/\+\s*#property\s+description\s+"([^"]+)"/);

  const name = nameMatch?.[1]?.trim() || `MQL${version.slice(3)} Strategy`;

  // Entry signals
  const entryMatches =
    content.match(/(?:OrderSend|PositionOpen)\([^)]*?(?:(?:OP_BUY|ORDER_TYPE_BUY|POSITION_TYPE_BUY)[^)]*\))/g) || [];
  
  const exitMatches =
    content.match(/(?:OrderClose|PositionClose)\([^)]+?\)/g) || [];

  // Detect strategy type from keywords
  const type =
    /scalp/i.test(content) ? "SCALPING" :
    /swing/i.test(content) ? "SWING" :
    /position/i.test(content) ? "POSITION" :
    /quant/i.test(content) || /stati/i.test(content) ? "QUANT" :
    /order.*block|breaker|bos|fvg|liquidity.*(?:void|sweep)/i.test(content) ? "SMC" :
    "DAY";

  return {
    success: true,
    definition: {
      name: `${name} (${version})`,
      type,
      entry_conditions: entryMatches.length
        ? [`${entryMatches.length} OrderSend/PositionOpen calls detected`]
        : undefined,
      exit_conditions: exitMatches.length
        ? [`${exitMatches.length} OrderClose/PositionClose calls detected`]
        : undefined,
    },
  };
}
```

**`src/lib/parsers/python-parser.ts`** — Python strategy validator:

```typescript
import type { StrategyDef } from "@/lib/validators/strategy";

export function parsePython(
  content: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  // Check for common trading framework imports
  const hasFramework =
    /import\s+(?:zipline|backtrader|vectorbt|alpaca|ccxt)/i.test(content);

  const nameMatch =
    content.match(/#\s*(?:Strategy|Name|Title):\s*(.+)/) ||
    content.match(/class\s+(\w+(?:Strategy|Bot|Trader))\s*(?:\(|:)/);

  const name = nameMatch?.[1]?.trim() || "Python Strategy";

  // Detect entry/exit functions
  const hasEntry = /def\s+(?:buy|enter|long|signal)/i.test(content);
  const hasExit = /def\s+(?:sell|exit|short|close)/i.test(content);
  const hasRisk = /(?:stop_loss|take_profit|risk|max_drawdown)/i.test(content);

  const type =
    /quant/i.test(content) || /stati/i.test(content) || /model/i.test(content)
      ? "QUANT"
      : /swing/i.test(content)
      ? "SWING"
      : "DAY";

  return {
    success: true,
    definition: {
      name,
      type,
      entry_conditions: hasEntry
        ? ["(detected entry function — validate signals in backtest)"]
        : ["⚠️ No entry function detected"],
      exit_conditions: hasExit
        ? ["(detected exit function)"]
        : ["⚠️ No exit function detected"],
      risk_parameters: hasRisk
        ? undefined
        : {
            max_position_size_pct: 5,
            stop_loss_pct: 2,
            take_profit_pct: 5,
          },
    },
    warnings: hasFramework
      ? undefined
      : ["No recognised trading framework import detected"],
  };
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | grep -i "parsers\|error" | head -10
```

**Step 3: Commit**

```bash
git add src/lib/parsers/
git commit -m "feat: add strategy parsers (Pine, MQL, Python → USF)"
```

---

### Task 4: Create `/api/strategies` CRUD endpoint

**Objective:** REST endpoint: `POST /api/strategies` (upload+parse), `GET /api/strategies` (list), `GET /api/strategies/:id`

**Files:**
- Create: `src/app/api/strategies/route.ts`
- Create: `src/app/api/strategies/[id]/route.ts`

**Step 1: Write POST + GET handler**

**`src/app/api/strategies/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { strategyUploadSchema } from "@/lib/validators/strategy";
import { parseStrategy } from "@/lib/parsers/strategy-parser";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strategies: data });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // 1. Parse multipart form
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file || !(file instanceof File)) {
    // Try JSON body for programmatic upload
    const body = await req.json().catch(() => null);
    if (!body?.name) {
      return NextResponse.json(
        { error: "file or JSON body with name+content required" },
        { status: 400 }
      );
    }
    return handleJsonUpload(body, supabase);
  }

  // 2. Read file
  const content = await file.text();
  const file_type = file.name.split(".").pop()?.toUpperCase() || "TXT";

  // 3. Parse
  const parsed = await parseStrategy(content, file_type, file.name);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error || "Parse failed" },
      { status: 422 }
    );
  }

  // 4. Insert into Supabase
  const { data, error } = await supabase
    .from("strategies")
    .insert({
      name: parsed.definition!.name || file.name,
      strategy_type: parsed.definition!.type,
      market: parsed.definition!.market,
      asset_class: parsed.definition!.asset_class,
      timeframe: parsed.definition!.timeframe,
      strategy_definition: parsed.definition! as any,
      risk_model: parsed.definition!.risk_parameters as any,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Also insert upload record
  await supabase.from("strategy_uploads").insert({
    strategy_id: data.id,
    file_type,
    source_file: file.name,
    parsed_output: parsed.definition as any,
    status: "PARSED",
  });

  return NextResponse.json(
    { strategy: data, warnings: parsed.warnings },
    { status: 201 }
  );
}

async function handleJsonUpload(body: any, supabase: any) {
  // Programmatic JSON upload — parse, insert
  const parseResult = await parseStrategy(
    body.content || "",
    body.file_type || "TXT",
    body.file_name || body.name
  );

  const definition = parseResult.success
    ? parseResult.definition!
    : { name: body.name, type: body.strategy_type || "HYBRID" };

  const { data, error } = await supabase
    .from("strategies")
    .insert({
      name: definition.name || body.name,
      strategy_type: body.strategy_type || definition.type,
      market: definition.market || body.market,
      asset_class: definition.asset_class || body.asset_class,
      timeframe: definition.timeframe || body.timeframe,
      strategy_definition: definition as any,
      risk_model: body.risk_model || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { strategy: data, warnings: ["JSON upload — parsing skipped"] },
    { status: 201 }
  );
}
```

**`src/app/api/strategies/[id]/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("strategies")
    .select("*, strategy_uploads(*), strategy_signals(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strategy: data });
}
```

**Step 2: Verify compilation + quick smoke test**

```bash
npx tsc --noEmit 2>&1 | grep -c "error"
# Expected: 0 errors
```

**Step 3: Commit**

```bash
git add src/app/api/strategies/
git commit -m "feat: add /api/strategies CRUD (POST upload+parse, GET list, GET detail)"
```

---

### Task 5: Update Strategies frontend page — wire upload + registry

**Objective:** Replace hardcoded strategy data with live Supabase fetch + real file upload UI

**Files:**
- Modify: `src/app/strategies/page.tsx` (convert to client component with real logic)

**New page (hybrid: server data fetch + client upload):**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard, Pill, SectionTitle } from "@/components/ui/glass";
import { FileCode2, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const FORMATS = ["Pine Script", "MQL4", "MQL5", "Python", "TXT", "Markdown", "JSON", "YAML"];

type Strategy = {
  id: string;
  name: string;
  market?: string;
  timeframe?: string;
  strategy_type: string;
  created_at: string;
  status?: string;
};

export default function StrategiesPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/strategies");
      const json = await res.json();
      if (json.strategies) setStrategies(json.strategies);
    } catch {
      // API not wired yet — use mock
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
          setMessage(`✅ \"${file.name}\" uploaded`);
          fetchStrategies();
        } else {
          setMessage(`❌ \"${file.name}\": ${json.error || "upload failed"}`);
        }
      } catch (err) {
        setMessage(`❌ \"${file.name}\": network error`);
      }
    }

    setUploading(false);
    e.target.value = ""; // reset input
  };

  // ── Detail view for selected strategy ──
  const detail = strategies.find((s) => s.id === selected);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Strategy Workspace</h1>
          <p className="text-xs text-neutral">
            {strategies.length
              ? `${strategies.length} strategies in registry`
              : "Upload to start your strategy registry"}
          </p>
        </div>
        <button
          onClick={fetchStrategies}
          disabled={fetching}
          className="glass-card p-2 text-sm"
          aria-label="Refresh strategies"
        >
          <RefreshCw size={16} className={cn(fetching && "animate-spin")} />
        </button>
      </div>

      {/* Upload dropzone */}
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
            {uploading ? "Uploading..." : "Upload strategy"}
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

      {/* Status message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm",
            message.startsWith("✅")
              ? "bg-bull/10 border border-bull/30 text-bull"
              : "bg-bear/10 border border-bear/30 text-bear"
          )}
        >
          <AlertCircle size={14} />
          {message}
        </div>
      )}

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <Pill key={f} tone="neutral">{f}</Pill>
        ))}
      </div>

      {/* Strategy registry */}
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
            No strategies yet — upload your first Pine/MQL/Python file above
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
                  <span className="tabular text-xs text-neutral">
                    {s.strategy_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Selected strategy detail */}
      {detail && (
        <GlassCard className="border-cyan/20">
          <SectionTitle
            title={detail.name}
            action={<Pill tone="cyan">{detail.strategy_type}</Pill>}
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            {detail.market && (
              <div>
                <span className="text-neutral">Market</span>
                <div className="font-semibold mt-0.5">{detail.market}</div>
              </div>
            )}
            {detail.timeframe && (
              <div>
                <span className="text-neutral">Timeframe</span>
                <div className="font-semibold mt-0.5">{detail.timeframe}</div>
              </div>
            )}
            <div>
              <span className="text-neutral">Added</span>
              <div className="font-semibold mt-0.5">
                {new Date(detail.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-neutral">Status</span>
              <div className="font-semibold mt-0.5">{detail.status || "Active"}</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Sign-in prompt */}
      {!user && strategies.length === 0 && (
        <div className="text-center text-[10px] text-neutral/60 mt-2">
          Sign in to persist strategies across sessions.<br />
          Strategy parsing works offline — plug in Supabase env vars.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -10
cd /root/trading-platform && npm run build 2>&1 | tail -15
```

**Step 3: Commit**

```bash
git add src/app/strategies/page.tsx
git commit -m "feat: wire strategies page to /api/strategies (upload + live registry)"
```

---

### Task 6: Add signal generation stub + real-time subscription

**Objective:** Generate mock signals for registered strategies + wire Supabase Realtime subscription

**Files:**
- Modify: `src/app/strategies/page.tsx` (add signal subscription)
- Create: `src/app/api/strategies/[id]/signals/route.ts` (GET latest signals)

**Step 1: Write signals endpoint**

**`src/app/api/strategies/[id]/signals/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("strategy_signals")
    .select("*")
    .eq("strategy_id", id)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signals: data });
}
```

**Step 2: Verify build**

```bash
npx tsc --noEmit 2>&1 | head -5
```

**Step 3: Commit**

```bash
git add src/app/api/strategies/
git commit -m "feat: add /api/strategies/[id]/signals endpoint"
```

---

### Task 7: Dev server smoke test + route verification

**Objective:** Run dev server, test all Phase 2 routes respond

**Step 1: Start dev in background**

```bash
cd /root/trading-platform
npm run dev &
sleep 8
```

**Step 2: Smoke test all routes**

```bash
# Health check
curl -sS http://localhost:3000/api/health | python3 -m json.tool

# Strategies list
curl -sS http://localhost:3000/api/strategies | python3 -m json.tool

# Dashboard (verify hydration fix holds)
curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard

# Terminal
curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/terminal

# Strategies page
curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/strategies
```

**Expected:** All return 200. `/api/strategies` returns `{"strategies": [...]}` or `{"error": "..."}` if Supabase envs are placeholder (expected behavior — app degrades gracefully).

**Step 3: Kill dev server + commit summary**

```bash
kill %1 2>/dev/null || true
```

---

## Verification Checklist

- [ ] `/api/health` returns `{"status":"healthy","version":"0.2.0"}`
- [ ] `/api/strategies` GET returns strategy list (empty or Supabase-backed)
- [ ] `/api/strategies` POST with file upload: parses + returns `{"strategy": {...}}`
- [ ] `/api/strategies/:id` returns single strategy with uploads+signals
- [ ] Strategies page renders live registry data (or empty state if no Supabase)
- [ ] Strategies page file upload → dropzone → /api/strategies POST pipeline works
- [ ] Pine parser extracts SMC/ICT keywords correctly
- [ ] MQL parser extracts entry/exit calls correctly
- [ ] All routes still HTTP 200 after Phase 2 changes
- [ ] `tsc --noEmit` passes with 0 errors
- [ ] `npm run build` succeeds

## Risks & Notes

- **Supabase env vars are placeholders:** All `/api/strategies` calls will fail gracefully (return `{"error": "..."}`). Strategies page shows empty state. Works correctly once user plugs in real Supabase URL + keys.
- **Parsers are regex-based:** Pine/MQL parsers use regex pattern matching, not compiler-grade AST. Edge cases (minified code, unusual formatting) may miss extraction. Phase 3+ introduces proper transpiler.
- **No real signal generation:** Signals endpoint only returns stored signals. Phase 3 backtesting will generate actual signals from historical data.
- **Phase 2 builds on Phase 1:** All 6 dashboard modules remain intact. Only strategies module gets a real API backend.