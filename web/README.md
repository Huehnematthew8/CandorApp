# Candor Web (Next.js + shadcn + Tailwind)

Next.js 14 App Router frontend for the Candor job application tracker. Auth, dashboard, and My Story talk to the Candor API (see **server/** in the repo root).

## Stack

- **Next.js 14** (App Router, Turbopack)
- **Tailwind CSS** — Candor design tokens in `globals.css`
- **shadcn/ui** — Button, Card, Input, Tabs (customized for dark theme)

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
```

Set in `.env.local`: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`) and, for Google sign-in, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The backend must be running (see root **README.md** and **server/README.md**).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register or log in to use the dashboard.

## Routes

- `/` — Landing (sign in / register)
- `/dashboard` — Board (sidebar + company detail, Cover Letter / Notes / Contacts tabs)
- `/dashboard/tracker` — All Jobs (sortable, filterable table)
- `/dashboard/profile` — My Story (narrative, timeline, skills, strengths, observations)

## Add more shadcn components

```bash
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
```

Components live in `src/components/ui/` and use Candor CSS variables.
