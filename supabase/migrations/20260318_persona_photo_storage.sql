-- Create storage bucket for persona model photos
-- Run this in Supabase SQL Editor

-- 1. Create the bucket (public so URLs are accessible without auth)
insert into storage.buckets (id, name, public)
values ('persona-photos', 'persona-photos', true)
on conflict (id) do nothing;

-- 2. Allow any authenticated user to upload
create policy if not exists "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'persona-photos');

-- 3. Allow public read access (so <img src> works without token)
create policy if not exists "Allow public read"
on storage.objects
for select
to public
using (bucket_id = 'persona-photos');

-- 4. Allow owner to update/replace their own files
create policy if not exists "Allow authenticated updates"
on storage.objects
for update
to authenticated
using (bucket_id = 'persona-photos');

-- 5. Allow owner to delete their own files
create policy if not exists "Allow authenticated deletes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'persona-photos');
