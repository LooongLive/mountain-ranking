insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dashboard-site',
  'dashboard-site',
  true,
  10485760,
  array[
    'text/html',
    'text/css',
    'application/javascript',
    'text/javascript',
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read dashboard site" on storage.objects;
create policy "public read dashboard site"
on storage.objects
for select
to anon
using (bucket_id = 'dashboard-site');

