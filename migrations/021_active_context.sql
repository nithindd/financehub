-- Migration 021: Active profile/context switcher
--
-- Per product decision: once signed in, a user can switch between "profiles" —
-- their own individual view, or one of the households they belong to — and
-- whichever is selected determines what data they see *everywhere* (dashboard,
-- reports, debts, etc.), not just in a dedicated "family" tab. This column is the
-- switch; src/lib/household-context.ts reads it and is the one place every
-- domain's read queries should go through to stay consistent with whatever
-- profile is currently active.

alter table user_preferences
  add column if not exists active_household_id uuid references households(id) on delete set null;

comment on column user_preferences.active_household_id is
  'Which "profile" the user is currently viewing data as: null = their own individual view, or a household id = the shared view for that household. Set via switchActiveContext() in src/lib/household-context.ts.';

-- If a household is deleted or the user leaves it, don't strand them silently
-- viewing a context they no longer belong to.
create or replace function clear_active_context_if_not_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update user_preferences
    set active_household_id = null
    where user_id = old.user_id
      and active_household_id = old.household_id;
  return old;
end;
$$;

create trigger on_household_member_removed
  after delete on household_members
  for each row execute function clear_active_context_if_not_member();
