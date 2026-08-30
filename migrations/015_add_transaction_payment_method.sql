-- Add payment_method_id to transactions table
ALTER TABLE transactions 
ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN transactions.payment_method_id IS 'Link to the specific payment method (card) used for this transaction';
