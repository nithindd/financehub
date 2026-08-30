-- Migration 019: Households (family view)
--
-- Design goal: every individual's own view keeps working exactly as before
-- (existing "Users can view own X" policies are untouched). A household adds an
-- *additional*, opt-in, read-only view: a user can grant other household members
-- read access scoped per data domain (accounts, transactions, creditors) rather
-- than one all-or-nothing switch — e.g. share debt visibility with a spouse
-- without also sharing day-to-day expense transactions. Mutations
-- (insert/update/delete) remain owner-only always — a family view is a joined
-- read, never joint editing. Postgres RLS policies for the same command are OR'd
-- together by default, so this is purely additive: no existing policy is dropped.
--
-- A user can belong to more than one household (e.g. "immediate family" and
-- "roommates" separately) — membership is purely `household_members`, a plain
-- many-to-many join table (its primary key is (household_id, user_id), so the
-- same user_id can appear in as many rows/households as needed). There is
-- deliberately no single "current household" column anywhere; visibility is
-- computed by checking for ANY shared household between two users.

create table households (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table households enable row level security;

create table household_members (
  household_id uuid references households on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (household_id, user_id)
);

alter table household_members enable row level security;

create index household_members_user_idx on household_members (user_id);

-- Granular, per-domain sharing. Each defaults to off — a user has to explicitly
-- opt each data type into the family view.
alter table user_preferences
  add column if not exists share_accounts_with_household boolean not null default false,
  add column if not exists share_transactions_with_household boolean not null default false,
  add column if not exists share_creditors_with_household boolean not null default false;

comment on column user_preferences.share_accounts_with_household is 'If true, household members can view (read-only) this user''s chart of accounts';
comment on column user_preferences.share_transactions_with_household is 'If true, household members can view (read-only) this user''s transactions/journal entries';
comment on column user_preferences.share_creditors_with_household is 'If true, household members can view (read-only) this user''s creditors/debt data';

-- Households policies
create policy "Members can view own household" on households for select using (
  exists (select 1 from household_members hm where hm.household_id = households.id and hm.user_id = auth.uid())
);
create policy "Authenticated users can create a household" on households for insert with check (created_by = auth.uid());
create policy "Owners can update household" on households for update using (created_by = auth.uid());

-- Household membership policies
create policy "Members can view household roster" on household_members for select using (
  exists (select 1 from household_members hm2 where hm2.household_id = household_members.household_id and hm2.user_id = auth.uid())
);
create policy "Household owners can add members" on household_members for insert with check (
  -- the creator adding themselves as the first (owner) row
  (user_id = auth.uid() and not exists (select 1 from household_members hm where hm.household_id = household_members.household_id))
  or exists (select 1 from household_members hm where hm.household_id = household_members.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
);
create policy "Household owners can remove members" on household_members for delete using (
  exists (select 1 from household_members hm where hm.household_id = household_members.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
  or user_id = auth.uid() -- a member can always remove themselves (leave)
);

-- Returns true if viewer_id is allowed to read target_user_id's data in the given
-- scope through the household/family view: true if they share ANY common
-- household (a user may belong to several) and target has that scope opted in.
-- scope is one of 'accounts' | 'transactions' | 'creditors'.
create or replace function household_can_view(target_user_id uuid, viewer_id uuid, scope text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from household_members hm_target
    join household_members hm_viewer on hm_viewer.household_id = hm_target.household_id
    join user_preferences up on up.user_id = hm_target.user_id
    where hm_target.user_id = target_user_id
      and hm_viewer.user_id = viewer_id
      and (
        (scope = 'accounts' and up.share_accounts_with_household)
        or (scope = 'transactions' and up.share_transactions_with_household)
        or (scope = 'creditors' and up.share_creditors_with_household)
      )
  );
$$;

-- Additive read-only household visibility on the existing domain tables.
-- Individual (owner-only) policies from schema.sql / 012_payment_methods.sql / 016_debt_module.sql
-- are untouched; these are extra, OR'd-in SELECT policies, one per scope.

create policy "Household members can view shared accounts" on accounts for select using (
  household_can_view(user_id, auth.uid(), 'accounts')
);

create policy "Household members can view shared transactions" on transactions for select using (
  household_can_view(user_id, auth.uid(), 'transactions')
);

create policy "Household members can view shared journal entries" on journal_entries for select using (
  exists (
    select 1 from transactions t
    where t.id = journal_entries.transaction_id
      and household_can_view(t.user_id, auth.uid(), 'transactions')
  )
);

create policy "Household members can view shared creditors" on creditors for select using (
  household_can_view(user_id, auth.uid(), 'creditors')
);
