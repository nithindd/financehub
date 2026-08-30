-- Update the 'evidence' bucket to be private
update storage.buckets
set public = false
where id = 'evidence';

-- Ensure RLS is enabled (it should be, but good to double check)
alter table storage.objects enable row level security;

-- The existing RLS policies from 004_storage_setup.sql are:
-- 1. "Users can upload evidence" (Insert) -> Checks auth.role() = 'authenticated'
-- 2. "Users can view evidence" (Select) -> Checks bucket_id = 'evidence' (This was fine for public, but for private we might want stricter rules if using pure RLS, but for Signed URLs we bypass RLS for the signature generation usually, or the signed URL grants access. Actually Supabase Signed URLs work even with private buckets.)
-- 3. "Users can delete own evidence" -> Checks auth.uid() owner.

-- We should probably tighten the SELECT policy to only allow users to see their OWN files if they were querying the table directly, 
-- but Signed URLs are the primary access method now.
-- Let's update the select policy to be safer just in case.

drop policy if exists "Users can view evidence" on storage.objects;

create policy "Users can view own evidence"
on storage.objects for select
using (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
