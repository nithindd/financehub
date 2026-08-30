-- Migration 016: Debt module
-- Adds debt-specific metadata on top of the existing ledger instead of a parallel
-- invoice/payment system. A creditor is a 1:1 extension of an existing LIABILITY
-- account; its balance is derived from the account's journal_entries, not stored here.
-- See docs/CONSOLIDATION_ANALYSIS.md section 2 for the rationale.

create table creditors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete cascade not null,
  name text not null,
  creditor_org text,
  debt_type text not null check (debt_type in ('credit_card', 'loan', 'medical', 'other')),
  apr numeric(6, 4) not null default 0,
  opening_balance numeric(12, 2) not null default 0,
  opening_date date not null,
  min_payment numeric(12, 2) not null default 0,
  credit_limit numeric(12, 2),
  due_day int check (due_day between 1 and 31),
  notes text,
  promo_apr numeric(6, 4),
  promo_start_month text, -- 'YYYY-MM'
  promo_end_month text,   -- 'YYYY-MM' or null = never expires
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (account_id)
);

alter table creditors enable row level security;

create policy "Users can view own creditors" on creditors for select using (auth.uid() = user_id);
create policy "Users can insert own creditors" on creditors for insert with check (auth.uid() = user_id);
create policy "Users can update own creditors" on creditors for update using (auth.uid() = user_id);
create policy "Users can delete own creditors" on creditors for delete using (auth.uid() = user_id);

-- A creditor's planned monthly payment over time. Segments may span years; if
-- segments overlap for the same month, the most-recently-created one wins (mirrors
-- DebtDashboard's planAmountForMonth "last-defined one wins" rule).
create table payment_plan_segments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  creditor_id uuid references creditors on delete cascade not null,
  start_month text not null, -- 'YYYY-MM'
  end_month text,            -- 'YYYY-MM' or null = open-ended
  amount numeric(12, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payment_plan_segments enable row level security;

create policy "Users can view own payment plan segments" on payment_plan_segments for select using (auth.uid() = user_id);
create policy "Users can insert own payment plan segments" on payment_plan_segments for insert with check (auth.uid() = user_id);
create policy "Users can update own payment plan segments" on payment_plan_segments for update using (auth.uid() = user_id);
create policy "Users can delete own payment plan segments" on payment_plan_segments for delete using (auth.uid() = user_id);

create index payment_plan_segments_creditor_idx on payment_plan_segments (creditor_id);
