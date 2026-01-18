-- Migration 011: Add Admin Role
-- This migration adds an is_admin column to the profiles table

ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Index for faster admin lookups
CREATE INDEX profiles_is_admin_idx ON profiles (is_admin);

-- Comment
COMMENT ON COLUMN profiles.is_admin IS 'Boolean flag indicating if the user has administrative privileges';
