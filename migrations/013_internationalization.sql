-- Add localization preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en-US';

-- Add currency details to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS original_currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS original_amount numeric(12, 2),
ADD COLUMN IF NOT EXISTS exchange_rate numeric(10, 6) DEFAULT 1.0;

-- Update existing transactions to have defaults
UPDATE transactions 
SET 
  original_currency = 'USD',
  original_amount = (
    SELECT SUM(amount) 
    FROM journal_entries 
    WHERE journal_entries.transaction_id = transactions.id 
    AND journal_entries.entry_type = 'DEBIT' 
    LIMIT 1
  ),
  exchange_rate = 1.0
WHERE original_currency IS NULL;
