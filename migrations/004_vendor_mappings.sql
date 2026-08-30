-- Create vendor_mappings table for auto-categorization
CREATE TABLE IF NOT EXISTS vendor_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_pattern TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_pattern)
);

-- Enable RLS
ALTER TABLE vendor_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own mappings"
  ON vendor_mappings FOR ALL
  USING (auth.uid() = user_id);
