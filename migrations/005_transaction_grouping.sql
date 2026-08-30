-- Add parent_id to transactions for grouping line items
alter table transactions 
add column parent_id uuid references transactions(id) on delete cascade;

-- Index for performance when fetching children
create index idx_transactions_parent_id on transactions(parent_id);
