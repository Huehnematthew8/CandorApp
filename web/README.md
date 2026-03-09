# Candor Web (Next.js + Supabase + shadcn + Tailwind)

Candor job application tracker — Next.js 14 App Router, Supabase, shadcn/ui, Tailwind CSS, dark Candor theme.

## Stack

- **Next.js 14** (App Router, Turbopack)
- **Tailwind CSS** — Candor design tokens in `globals.css`
- **shadcn/ui** — Button, Card, Input, Tabs (customized for dark theme)
- **Supabase** — Auth + DB (optional; app runs with demo data without env)

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local   # optional: add Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use “Continue to Dashboard” or “Skip to demo dashboard” to reach the app.

## Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. In SQL Editor, run `supabase/schema.sql` to create tables and RLS.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

Without these, the app still runs using in-memory demo data.

**To get the app fully functioning** (auth + real data): see **[GETTING_STARTED.md](./GETTING_STARTED.md)** for step-by-step Supabase setup, schema, env vars, and how to add login + wire the UI to the database.

## Routes

- `/` — Onboarding (resume drop + continue to dashboard)
- `/dashboard` — Board (sidebar + company detail, Cover Letter / Notes / Contacts tabs)
- `/dashboard/tracker` — All Jobs (sortable, filterable table)
- `/dashboard/profile` — My Story (narrative, timeline, skills, strengths, observations)

## Add more shadcn components

```bash
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
```

Components live in `src/components/ui/` and use Candor CSS variables.
