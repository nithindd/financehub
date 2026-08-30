-- Create a bucket for evidence if it doesn't exist
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Set up RLS for Storage
-- Note: 'evidence' is the bucket name

-- Policy 1: Users can upload their own files
create policy "Users can upload evidence"
on storage.objects for insert
with check (
  bucket_id = 'evidence' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Users can view files (Public for simplicity in this demo, or restricted by path)
create policy "Users can view evidence"
on storage.objects for select
using (
  bucket_id = 'evidence'
);

-- Policy 3: Users can delete their own files
create policy "Users can delete own evidence"
on storage.objects for delete
using (
  bucket_id = 'evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
