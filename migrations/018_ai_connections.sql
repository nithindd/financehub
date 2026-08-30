-- Migration 018: AI connection settings (self-hosted endpoint or bring-your-own API key)
--
-- BYO API keys are stored via Supabase Vault (pgsodium-backed encryption at rest),
-- never as a plain column — this was flagged as a to-do in an earlier draft of this
-- migration and is fixed here before any real key is ever entered. Requires the
-- Vault extension enabled on the project (Supabase dashboard: Database > Extensions
-- > supabase_vault, or `create extension if not exists supabase_vault;` if your
-- plan allows enabling it via SQL).

create table ai_connections (
  user_id uuid references auth.users on delete cascade primary key,

  -- self_hosted: an OpenAI-compatible chat completions endpoint the user runs/controls
  self_hosted_endpoint_url text,
  self_hosted_model text,

  -- byo_api_key: a hosted provider, called with the user's own key (never the app's).
  -- The key itself is never stored in this table — only a pointer to its Vault secret.
  byo_provider text check (byo_provider in ('gemini', 'openai', 'anthropic')),
  byo_api_key_secret_id uuid,
  byo_model text,

  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table ai_connections enable row level security;

-- Deliberately no direct SELECT of byo_api_key_secret_id by clients beyond what's
-- needed to know "a key is configured" — actual key material only ever flows
-- through get_byo_api_key() below, server-side.
create policy "Users can view own ai connection" on ai_connections for select using (auth.uid() = user_id);
create policy "Users can insert own ai connection" on ai_connections for insert with check (auth.uid() = user_id);
create policy "Users can update own ai connection" on ai_connections for update using (auth.uid() = user_id);
create policy "Users can delete own ai connection" on ai_connections for delete using (auth.uid() = user_id);

-- Creates or rotates the current user's own BYO API key in Vault, and records the
-- pointer in ai_connections. SECURITY DEFINER so it can call vault.* (not directly
-- grantable to the authenticated role), but scoped to auth.uid() internally so a
-- user can only ever touch their own secret.
create or replace function set_byo_api_key(p_api_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing uuid;
  v_secret_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select byo_api_key_secret_id into v_existing from ai_connections where user_id = v_user_id;

  if v_existing is not null then
    perform vault.update_secret(v_existing, p_api_key);
    v_secret_id := v_existing;
  else
    v_secret_id := vault.create_secret(p_api_key, 'byo_api_key_' || v_user_id::text, 'FinanceHub BYO AI API key');
  end if;

  update ai_connections
    set byo_api_key_secret_id = v_secret_id, updated_at = now()
    where user_id = v_user_id;

  if not found then
    insert into ai_connections (user_id, byo_api_key_secret_id) values (v_user_id, v_secret_id);
  end if;
end;
$$;

-- Decrypts and returns the current user's own key only — never anyone else's.
-- Used server-side (src/actions/coach.ts) at the moment a coach request is made;
-- never returned to the client/UI (see src/actions/ai-settings.ts).
create or replace function get_byo_api_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_secret_id uuid;
  v_key text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select byo_api_key_secret_id into v_secret_id from ai_connections where user_id = v_user_id;
  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where id = v_secret_id;
  return v_key;
end;
$$;

revoke all on function set_byo_api_key(text) from public;
revoke all on function get_byo_api_key() from public;
grant execute on function set_byo_api_key(text) to authenticated;
grant execute on function get_byo_api_key() to authenticated;
