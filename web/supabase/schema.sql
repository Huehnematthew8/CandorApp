-- Candor Supabase schema (run in SQL Editor in Supabase dashboard)

create type job_status as enum (
  'draft', 'applied', 'screening', 'round1', 'round2', 'offer', 'rejected'
);

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text default '💻',
  open boolean default true,
  "order" int default 0,
  created_at timestamptz default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references public.industries(id) on delete cascade,
  name text not null,
  role text not null default '',
  location text,
  salary text,
  status job_status default 'draft',
  logo text default '🌐',
  email_to text,
  email_subject text,
  email_draft text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  role text,
  initials text
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.industries enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.notes enable row level security;

create policy "Users can manage own industries"
  on public.industries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage companies in own industries"
  on public.companies for all
  using (
    exists (
      select 1 from public.industries
      where id = companies.industry_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.industries
      where id = companies.industry_id and user_id = auth.uid()
    )
  );

create policy "Users can manage contacts in own companies"
  on public.contacts for all
  using (
    exists (
      select 1 from public.companies c
      join public.industries i on i.id = c.industry_id
      where c.id = contacts.company_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      join public.industries i on i.id = c.industry_id
      where c.id = contacts.company_id and i.user_id = auth.uid()
    )
  );

create policy "Users can manage notes in own companies"
  on public.notes for all
  using (
    exists (
      select 1 from public.companies c
      join public.industries i on i.id = c.industry_id
      where c.id = notes.company_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      join public.industries i on i.id = c.industry_id
      where c.id = notes.company_id and i.user_id = auth.uid()
    )
  );
