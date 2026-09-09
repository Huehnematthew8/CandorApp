-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)

create table if not exists profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  name text default '',
  title text default '',
  location text default '',
  narrative text default '',
  looking_for text default '',
  timeline jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  strengths jsonb default '[]'::jsonb,
  observations jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can manage own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
