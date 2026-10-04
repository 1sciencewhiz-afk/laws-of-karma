-- Laws of Karma cloud save.
--
-- One row per browser identity (an anonymous Supabase Auth user — see
-- src/game/cloud.ts, which calls supabase.auth.signInAnonymously()).
-- Row Level Security ties every read/write to auth.uid(), so a visitor can
-- only ever see their own soul, never anyone else's, even though the
-- anon key itself is public in the client bundle.
--
-- Run this once against your Supabase project (SQL editor, or `supabase db
-- push` if you use the CLI), and enable Anonymous Sign-Ins under
-- Authentication → Providers first, or signInAnonymously() will fail.

create table if not exists public.souls (
  user_id uuid primary key references auth.users (id) on delete cascade,
  life integer not null default 1,
  form text not null default 'prince',
  atman jsonb not null default '{}'::jsonb,
  journal jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.souls enable row level security;

create policy "souls_select_own" on public.souls
  for select
  using (auth.uid() = user_id);

create policy "souls_insert_own" on public.souls
  for insert
  with check (auth.uid() = user_id);

create policy "souls_update_own" on public.souls
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
