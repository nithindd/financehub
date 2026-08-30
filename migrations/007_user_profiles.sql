-- Migration 007: Add User Profile Fields
-- This migration adds username, first_name, last_name to the profiles table
-- and creates necessary indexes and constraints

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN username TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX profiles_username_key ON profiles (LOWER(username));

-- Backfill username for existing users from their email
-- Extract the part before @ in email
UPDATE profiles
SET username = SPLIT_PART((SELECT email FROM auth.users WHERE auth.users.id = profiles.id), '@', 1)
WHERE username IS NULL;

-- Now make username NOT NULL
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- Update the existing trigger or create one to populate profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_username TEXT;
  meta_username TEXT;
BEGIN
  -- Check if username is provided in metadata
  meta_username := NEW.raw_user_meta_data->>'username';
  
  IF meta_username IS NOT NULL THEN
    generated_username := meta_username;
  ELSE
    -- Generate username from email (part before @)
    generated_username := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  -- If username already exists, append random number
  WHILE EXISTS (SELECT 1 FROM profiles WHERE LOWER(username) = LOWER(generated_username)) LOOP
    generated_username := SPLIT_PART(NEW.email, '@', 1) || floor(random() * 10000)::text;
  END LOOP;
  
  INSERT INTO public.profiles (id, username, first_name, last_name, updated_at)
  VALUES (
    NEW.id, 
    generated_username, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username chosen by user';
COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';
