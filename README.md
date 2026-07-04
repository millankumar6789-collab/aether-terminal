# ⌖ Aether Terminal — Institutional AI Trading Platform

**Mobile-first, cloud-native trading platform** — order flow, SMC/ICT, multi-strategy consensus, AI research, portfolio analytics.

Inspired by: Bloomberg Terminal · TradingView · Bookmap · QuantConnect · Koyfin · Finviz · Portfolio Visualizer.

---

## ✅ Phase 1 — Foundation (this release)

The Phase 1 ship is a working Next.js 16 + Supabase shell with all six dashboard modules scaffolded, glassmorphism UI tuned for POCO X6 Pro (6.67" AMOLED, 1220×2712, 120Hz), and a Postgres schema with RLS ready to push to Supabase.

### What's here

| Area | Status |
|---|---|
| Next.js 16 + TS + Tailwind v4 | ✅ scaffolded, builds clean |
| Supabase SSR client (server + browser) | ✅ ready — plug in env vars |
| Auth provider (session + auth state) | ✅ scaffolded |
| Mobile-first layout shell (bottom thumb-zone nav) | ✅ live |
| Glassmorphism UI primitives (cards, tiles, pills) | ✅ live |
| 6 Dashboard modules (markets / terminal / strategies / portfolio / news / research) | ✅ routes live, seeded content |
| Postgres schema (14 tables, RLS, soft delete, audit design) | ✅ `supabase/schema.sql` |
| `.env.example` with all env vars (incl. AI failover chain) | ✅ |
| Vercel config (security headers, regions) | ✅ |
| PWA manifest | ✅ |

### What's NOT here yet (intentional — phases 2–6)

- Live market data (need Polygon / Alpaca / Binance WebSockets — paid or rate-limited)
- Strategy parsing pipeline (Pine/MQL/Python → Unified Strategy Format)
- Backtesting engine
- AI orchestration layer (multi-model failover: DeepSeek → Qwen → NVIDIA NIM)
- Order flow / footprint / volume profile rendering
- Institutional news feed ingestion
- CI/CD pipeline + security scans

---

## 🚀 Quick start

```bash
# 1. Install deps (already done on this machine)
npm install

# 2. Env vars — copy and fill
cp .env.example .env.local
#  → put your Supabase project URL + anon key in .env.local

# 3. Dev server
npm run dev
#  → http://localhost:3000

# 4. Production build (verifies everything compiles)
npm run build && npm start

# 5. Deploy to Vercel
# Connect the repo at https://vercel.com/new
# Vercel auto-detects Next.js. Set the env vars in the Vercel dashboard.
```

### Supabase setup

1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor (creates all tables + RLS policies)
3. Add the project URL and anon key to `.env.local` as
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. (Server-only) Add the service-role key as `SUPABASE_SERVICE_ROLE_KEY`

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────┐
│  Vercel (Next.js 16 — SSR + Edge)               │
│  ┌──────────────────────────────────────────┐   │
│  │  Mobile Shell (bottom thumb-zone nav)   │   │
│  │  Glassmorphism UI primitives            │   │
│  │  6 Dashboard modules                    │   │
│  └──────────────────────────────────────────┘   │
│                    │                            │
│                    ▼                            │
│  ┌──────────────────────────────────────────┐   │
│  │  Supabase (PostgreSQL + Auth + Realtime)│   │
│  │  - 14 core tables                       │   │
│  │  - Row Level Security                   │   │
│  │  - Soft deletes + audit design          │   │
│  └──────────────────────────────────────────┘   │
│                    │                            │
│                    ▼  (future phases)            │
│  Market data · AI failover · News feeds          │
└───────────────────────────────────────────────────┘
```

**Stack chosen per the spec's decision matrix:**

- **Frontend:** Next.js (per the matrix — Vercel-native, SSR, perf, enterprise)
- **Backend:** NestJS (selected in matrix; Phase 2 will introduce it as the strategy/API service)
- **DB:** Supabase + PostgreSQL (per matrix — best institutional value per cost)
- **Auth:** Supabase Auth (email, Google OAuth, GitHub OAuth)
- **Deploy:** GitHub → Vercel with environment variable management

---

## 🎨 Design system

- **Palette:** deep blue (ink-900 `#0a1024`) base, emerald accent, neon cyan primary
- **Glassmorphism:** frosted blur + soft glow, GPU-accelerated, 120Hz-capable
- **Type:** Inter (sans), JetBrains Mono (numbers, tabular)
- **Mobile-first:** optimized for 360 / 390 / 412 / 430 / 480 px widths
- **Thumb zone:** bottom-sticky nav bar, max 520px wide
- **No horizontal scroll ever** — `overflow-x: hidden` enforced at root
- **Safe-area aware:** respects notch + gesture bar via `env()`

---

## 🔐 Security notes

- `.env.local` is git-ignored — never commit secrets
- The exposed NVIDIA API key from the original spec doc must be revoked before use
- Vercel config ships strict security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- RLS enabled on every user-row table
- Service-role key only ever read on the server

---

## 📅 Roadmap

| Phase | Window | Deliverables |
|---|---|---|
| ~~1 — Foundation~~ | ~~2-4wk~~ | ✅ Done — auth, dashboard, mobile shell, schema |
| 2 — Strategy engine | 3-5wk | Strategy upload, parser, registry, signal gen |
| 3 — Backtesting | 3-6wk | Historical data, backtest, metrics, optimization |
| 4 — AI intelligence | 2-4wk | Multi-model routing, research assistant, news intel |
| 5 — Order flow + SMC | 4-8wk | Heatmaps, footprints, liquidity, BOS/CHoCH/FVG |
| 6 — Production hardening | 3-6wk | Security audits, perf, monitoring, scaling |

---

## 📁 Repo layout

```
trading-platform/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (viewport, providers, shell)
│   │   ├── page.tsx            # Landing — redirects to /dashboard seed
│   │   ├── globals.css        # Tailwind v4 + theme + glass primitives
│   │   ├── dashboard/         # Module 1 — Market Overview
│   │   ├── terminal/          # Module 2 — Trading Terminal
│   │   ├── strategies/        # Module 3 — Strategy Workspace
│   │   ├── portfolio/         # Module 4 — Portfolio Center
│   │   ├── news/              # Module 5 — News Intelligence
│   │   └── research/          # Module 6 — AI Research Center
│   ├── components/
│   │   ├── providers/         # Auth + client providers
│   │   ├── layout/            # MobileShell (thumb-zone nav)
│   │   └── ui/                # Glass primitives (Card, StatTile, Pill, SectionTitle)
│   └── lib/
│       ├── supabase/server.ts # Server + admin client factories
│       └── utils.ts           # cn() class merge
├── supabase/schema.sql        # 14 tables + RLS + indexes
├── .env.example               # ALL env vars (no real secrets)
├── vercel.json                # Security headers + region
└── public/app.webmanifest     # PWA manifest
```

---

*Phase 1 foundation — built and verified.*
