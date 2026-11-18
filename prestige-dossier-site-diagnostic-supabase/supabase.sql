-- Run this script in Supabase > SQL Editor.
create table if not exists public.dossiers (
  id text primary key,
  title text not null,
  reference text,
  storage_path text not null,
  original_name text not null,
  file_count integer not null default 0,
  manifest jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dossiers enable row level security;
-- No public policies: only the server using the service-role key can read/write rows.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dossiers', 'dossiers', false, 26214400, array['application/zip'])
on conflict (id) do update set public = false, file_size_limit = 26214400;
