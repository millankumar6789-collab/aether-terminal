-- ============================================================================
-- AETHER TERMINAL — Core schema (Phase 1)
-- Target: Supabase / PostgreSQL 15+
-- Design: ACID · RLS · auditability · soft deletes · data versioning
-- Run inside Supabase SQL editor or `supabase db push`.
-- ============================================================================

-- Required extensions -------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- fuzzy name search

-- Helpers -------------------------------------------------------------------
-- All timestamps stored as timestamptz (UTC). Soft delete via deleted_at.
-- Every table has an `id` uuid PK + created_at + updated_at.

-- ---------------------------------------------------------------------------
-- USERS & AUTH
-- ---------------------------------------------------------------------------
-- Using Supabase Auth (auth.users) — we keep a lightweight profile mirror
-- for denormalised display and RBAC joins.

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  username     text unique,
  role         text not null default 'TRADER'
                 check (role in ('TRADER','PORTFOLIO_MANAGER','ADMINISTRATOR')),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_login   timestamptz
);
create index if not exists profiles_email_idx    on public.profiles(email);
create index if not exists profiles_username_idx on public.profiles(username);

create table if not exists public.user_preferences (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  theme             text default 'dark',
  timezone          text default 'UTC',
  default_workspace text default 'dashboard',
  notification_settings jsonb default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- RBAC
-- ---------------------------------------------------------------------------
create table if not exists public.rbac_policies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  permissions jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.rbac_assignments (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  policy_id uuid not null references public.rbac_policies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, policy_id)
);

-- ---------------------------------------------------------------------------
-- PORTFOLIOS & POSITIONS
-- ---------------------------------------------------------------------------
create table if not exists public.portfolios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  base_currency text not null default 'USD',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists portfolios_user_idx on public.portfolios(user_id);

create table if not exists public.portfolio_positions (
  id              uuid primary key default gen_random_uuid(),
  portfolio_id    uuid not null references public.portfolios(id) on delete cascade,
  symbol          text not null,
  asset_class     text not null,
  quantity        numeric(28,8) not null default 0,
  avg_price       numeric(28,8) not null default 0,
  current_price   numeric(28,8) not null default 0,
  market_value    numeric(28,8) generated always as (quantity * current_price) stored,
  unrealized_pnl  numeric(28,8) generated always as ((current_price - avg_price) * quantity) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists positions_portfolio_idx on public.portfolio_positions(portfolio_id);
create index if not exists positions_symbol_idx    on public.portfolio_positions(symbol);

create table if not exists public.trades (
  id            uuid primary key default gen_random_uuid(),
  portfolio_id  uuid not null references public.portfolios(id) on delete cascade,
  symbol        text not null,
  direction     text not null check (direction in ('LONG','SHORT')),
  entry_price   numeric(28,8) not null,
  exit_price    numeric(28,8),
  quantity      numeric(28,8) not null,
  fees          numeric(28,8) default 0,
  pnl           numeric(28,8),
  "timestamp"   timestamptz not null default now()
);
create index if not exists trades_symbol_idx   on public.trades(symbol);
create index if not exists trades_port_idx     on public.trades(portfolio_id);
create index if not exists trades_time_idx     on public.trades("timestamp");

-- ---------------------------------------------------------------------------
-- STRATEGIES
-- ---------------------------------------------------------------------------
create table if not exists public.strategies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  market              text,
  asset_class         text,
  timeframe           text,
  strategy_type       text check (strategy_type in
                        ('SCALPING','DAY','SWING','POSITION','QUANT','SMC','ICT','HYBRID')),
  version             integer default 1,
  strategy_definition jsonb,
  risk_model          jsonb,
  user_id             uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists strategies_market_idx on public.strategies(market);
create index if not exists strategies_asset_idx  on public.strategies(asset_class);

create table if not exists public.strategy_uploads (
  id            uuid primary key default gen_random_uuid(),
  strategy_id   uuid references public.strategies(id) on delete cascade,
  file_type     text,
  source_file   text,
  parsed_output jsonb,
  status        text default 'PENDING' check (status in ('PENDING','PARSED','FAILED','ENABLED','DISABLED'))
);

create table if not exists public.strategy_signals (
  id          uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  symbol      text not null,
  signal      text not null check (signal in ('BUY','SELL','HOLD')),
  confidence  numeric(5,2) check (confidence between 0 and 100),
  "timestamp" timestamptz not null default now()
);
create index if not exists sig_symbol_idx on public.strategy_signals(symbol);
create index if not exists sig_time_idx   on public.strategy_signals("timestamp");

-- ---------------------------------------------------------------------------
-- BACKTESTS
-- ---------------------------------------------------------------------------
create table if not exists public.backtests (
  id          uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  symbol      text not null,
  start_date  date not null,
  end_date    date not null,
  results     jsonb,
  metrics     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists backtests_strategy_idx on public.backtests(strategy_id);

create table if not exists public.backtest_metrics (
  backtest_id    uuid primary key references public.backtests(id) on delete cascade,
  cagr           numeric(10,4),
  sharpe         numeric(10,4),
  sortino        numeric(10,4),
  calmar         numeric(10,4),
  max_drawdown   numeric(10,4),
  win_rate       numeric(5,2),
  profit_factor  numeric(10,4)
);

-- ---------------------------------------------------------------------------
-- NEWS & INSTITUTIONAL ACTIVITY
-- ---------------------------------------------------------------------------
create table if not exists public.news_articles (
  id          uuid primary key default gen_random_uuid(),
  headline    text not null,
  source      text,
  published_at timestamptz,
  url         text,
  raw_content text,
  created_at  timestamptz not null default now()
);
create index if not exists news_pub_idx on public.news_articles(published_at);

create table if not exists public.news_analysis (
  article_id       uuid primary key references public.news_articles(id) on delete cascade,
  bullish_score    numeric(5,2),
  bearish_score    numeric(5,2),
  neutral_score    numeric(5,2),
  confidence_score numeric(5,2),
  summary          text
);

create table if not exists public.institutional_activity (
  id            uuid primary key default gen_random_uuid(),
  symbol        text not null,
  activity_type text,        -- ACCUMULATION / DISTRIBUTION / FILING
  source        text,
  impact_score  numeric(5,2),
  "timestamp"   timestamptz not null default now()
);
create index if not exists instact_symbol_idx on public.institutional_activity(symbol);

create table if not exists public.insider_disclosures (
  id                uuid primary key default gen_random_uuid(),
  symbol            text not null,
  person_name       text,
  transaction_type  text,     -- BUY / SELL
  shares            numeric(28,8),
  filing_date       date
);
create index if not exists insider_symbol_idx on public.insider_disclosures(symbol);

-- ---------------------------------------------------------------------------
-- ALERTS / WATCHLISTS / JOURNAL / AI REPORTS
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text,
  message    text,
  priority   text check (priority in ('INFO','WARNING','CRITICAL','EMERGENCY')),
  status     text default 'UNREAD',
  created_at timestamptz not null default now()
);
create index if not exists alerts_user_idx on public.alerts(user_id);

create table if not exists public.watchlists (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name    text not null
);
create table if not exists public.watchlist_items (
  id            uuid primary key default gen_random_uuid(),
  watchlist_id  uuid not null references public.watchlists(id) on delete cascade,
  symbol        text not null,
  asset_class   text
);

create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  trade_id    uuid references public.trades(id) on delete set null,
  notes       text,
  mistakes    text,
  lessons     text,
  screenshots text[]
);

create table if not exists public.ai_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  report_type  text,
  content      jsonb,
  generated_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Users can only see/modify rows they own (user_id-match). Admins bypass.
-- ============================================================================
alter table public.portfolios              enable row level security;
alter table public.portfolio_positions     enable row level security;
alter table public.trades                  enable row level security;
alter table public.strategies              enable row level security;
alter table public.strategy_signals        enable row level security;
alter table public.backtests               enable row level security;
alter table public.alerts                  enable row level security;
alter table public.watchlists              enable row level security;
alter table public.watchlist_items         enable row level security;
alter table public.journal_entries          enable row level security;
alter table public.ai_reports              enable row level security;

-- Generic owner policy — adapt for portfolio_manager / admin in Phase 6.
create policy "own portfolios"        on public.portfolios      for select using (auth.uid() = user_id);
create policy "ins portfolios"        on public.portfolios      for insert with check (auth.uid() = user_id);
create policy "upd portfolios"        on public.portfolios      for update using (auth.uid() = user_id);
create policy "del portfolios"        on public.portfolios      for delete using (auth.uid() = user_id);

-- (Repeat pattern for other tables — Phase 6 will add RBAC role gating.)
