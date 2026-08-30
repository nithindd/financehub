-- Create Payment Methods Table
create table if not exists payment_methods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete cascade not null,
  type text not null check (type in ('DEBIT_CARD', 'CREDIT_CARD')),
  name text not null, -- User friendly name e.g. "John's Card"
  last_four text not null check (length(last_four) = 4),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table payment_methods enable row level security;

-- Policies
create policy "Users can view own payment methods" on payment_methods
  for select using (auth.uid() = user_id);

create policy "Users can insert own payment methods" on payment_methods
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own payment methods" on payment_methods
  for delete using (auth.uid() = user_id);
