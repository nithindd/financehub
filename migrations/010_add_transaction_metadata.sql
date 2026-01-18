-- Add vendor and items columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN transactions.vendor IS 'Name of the vendor extracted from OCR or manually entered';
COMMENT ON COLUMN transactions.items IS 'JSON array of line items extracted from OCR';
