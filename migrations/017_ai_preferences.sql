-- Migration 017: AI coach provider preference
-- "Local-first AI" (per user clarification) means the request never goes to a
-- shared/app-level API key: either a self-hosted, user-controlled endpoint
-- (e.g. Ollama/LM Studio/vLLM, OpenAI-compatible), or a hosted provider called
-- with the user's *own* API key. Both keep the app's own credentials out of it.
-- See docs/CONSOLIDATION_ANALYSIS.md section 5 and migrations/018_ai_connections.sql
-- for where the endpoint/key details are stored.

alter table user_preferences
  add column if not exists ai_provider text not null default 'self_hosted' check (ai_provider in ('self_hosted', 'byo_api_key')),
  add column if not exists ai_coach_enabled boolean not null default true;

comment on column user_preferences.ai_provider is 'Which AIProvider implementation to use for the coach: self_hosted (user''s own endpoint) or byo_api_key (hosted provider, user''s own key)';
comment on column user_preferences.ai_coach_enabled is 'Master on/off switch for the AI coach feature';
