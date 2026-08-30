-- Add missing DELETE policies to allow users to delete their own data

-- Transactions: Allow users to delete their own transactions
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

-- Accounts: Allow users to delete their own accounts (categories)
create policy "Users can delete own accounts" on accounts
  for delete using (auth.uid() = user_id);

-- Journal Entries: Allow users to delete their own journal entries
-- (Required even for CASCADE deletes in some RLS configurations)
create policy "Users can delete own journal entries" on journal_entries
  for delete using (
    exists (
      select 1 from transactions
      where transactions.id = journal_entries.transaction_id
      and transactions.user_id = auth.uid()
    )
  );

-- Vendor Mappings: Allow users to delete their own vendor mappings
create policy "Users can delete own vendor mappings" on vendor_mappings
  for delete using (auth.uid() = user_id);
