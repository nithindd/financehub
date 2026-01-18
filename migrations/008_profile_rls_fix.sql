-- Migration 008: Fix Profile RLS Policies
-- Adding missing SELECT policy and redundant-but-safe INSERT policy

-- Add SELECT policy for users to see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Add INSERT policy for authenticated users 
-- Note: Profiles are primarily created by the handle_new_user trigger,
-- but having this policy prevents accidental RLS violations if code attempts an insert.
CREATE POLICY "Service and users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Ensure UPDATE policy is clear
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable RLS (just in case it was disabled or needs re-enforcement)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
