create table if not exists public.dashboard_pages (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_pages enable row level security;

drop policy if exists "public read dashboard pages" on public.dashboard_pages;
create policy "public read dashboard pages"
on public.dashboard_pages
for select
to anon
using (true);

insert into public.dashboard_pages (id, data)
values ('headquarters-suggestions', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dashboard-media',
  'dashboard-media',
  true,
  524288000,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read dashboard media" on storage.objects;
create policy "public read dashboard media"
on storage.objects
for select
to anon
using (bucket_id = 'dashboard-media');

