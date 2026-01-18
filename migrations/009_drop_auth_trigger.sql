-- Migration 009: Drop problematic Auth trigger
-- This allows signup to succeed and delegates profile creation to the application layer.

-- Drop the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function (optional, but cleaner)
DROP FUNCTION IF EXISTS public.handle_new_user();
