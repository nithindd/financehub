-- Migration 020: Household invitations (email-based)
--
-- Replaces the "owner adds anyone by username" join path from migration 019 with a
-- proper invite/accept flow: an owner invites an email address, the invitation is
-- emailed (see src/actions/households.ts, reusing src/lib/email.ts / Resend — the
-- same email pipeline already used for report emails), and only the invited
-- person — authenticated, with a matching email — can accept it and join.

create table household_invitations (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households on delete cascade not null,
  invited_email text not null,
  invited_by uuid references auth.users not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '7 days') not null,
  responded_at timestamp with time zone
);

alter table household_invitations enable row level security;

create index household_invitations_email_idx on household_invitations (lower(invited_email));

-- Owners of the household can see/manage invitations they've sent.
create policy "Owners can view household invitations" on household_invitations for select using (
  exists (select 1 from household_members hm where hm.household_id = household_invitations.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
);
create policy "Owners can create household invitations" on household_invitations for insert with check (
  invited_by = auth.uid()
  and exists (select 1 from household_members hm where hm.household_id = household_invitations.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
);
create policy "Owners can revoke household invitations" on household_invitations for update using (
  exists (select 1 from household_members hm where hm.household_id = household_invitations.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
);
create policy "Owners can delete household invitations" on household_invitations for delete using (
  exists (select 1 from household_members hm where hm.household_id = household_invitations.household_id and hm.user_id = auth.uid() and hm.role = 'owner')
);

-- The invited person (matched by the email on their auth session, not by any
-- household membership) can see and respond to their own pending invitations.
create policy "Invited user can view own invitations" on household_invitations for select using (
  lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
create policy "Invited user can respond to own invitation" on household_invitations for update using (
  lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and status = 'pending'
);

-- Supersedes the direct "owner adds by username" path from migration 019: joining
-- a household now requires an accepted invitation matching the joiner's own email.
drop policy if exists "Household owners can add members" on household_members;

create policy "First member becomes owner on household creation" on household_members for insert with check (
  user_id = auth.uid() and not exists (select 1 from household_members hm where hm.household_id = household_members.household_id)
);

create policy "Invited users can join via an accepted invitation" on household_members for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from household_invitations hi
    where hi.household_id = household_members.household_id
      and hi.status = 'accepted'
      and lower(hi.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
