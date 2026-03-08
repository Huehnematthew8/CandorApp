# Candor — AI Job Application Tracker

A minimal, dark-themed AI-powered job application tracker. Next.js frontend and Express API with auth, profile (My Story), and AI-assisted emails (Gemini or Anthropic).

## For anyone cloning this repo

All steps below use paths relative to the **project root** (the folder that contains `web/` and `server/`). Clone the repo anywhere and run from that root.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (or a Supabase project — see server setup)

## Quick start

### 1. Backend (API + database)

From the project root:

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`: set at least `DATABASE_URL` (PostgreSQL) and `JWT_SECRET`. Optional: `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` for AI, `GOOGLE_CLIENT_ID` for Google sign-in. See **server/README.md** for full env and Supabase/local DB setup.

```bash
npx prisma migrate dev
npm run dev
```

API runs at **http://localhost:4000**.

### 2. Frontend (Next.js)

From the project root, in a new terminal:

```bash
cd web
npm install
cp .env.local.example .env.local
```

Edit `web/.env.local`: set `NEXT_PUBLIC_API_URL=http://localhost:4000` (and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if using Google login). Ensure `server/.env` has `CORS_ORIGIN` including your web origin (e.g. `http://localhost:3000` or `http://localhost:3002`).

```bash
npm run dev
```

Open **http://localhost:3000** (or the port shown). Register or log in, then use the dashboard.

## Project structure

| Path       | Description |
|-----------|-------------|
| `web/`    | Next.js 14 (App Router), Tailwind, shadcn — landing, login/register, dashboard, board, My Story |
| `server/` | Express + Prisma + PostgreSQL — auth (JWT + Google), industries/companies, profile, resume upload, AI email |

- **server/README.md** — Database setup (Supabase or local), env vars, migrations, API overview.
- **web/README.md** — Web stack, routes, optional Supabase.
- **WEB_SERVER_SYNC.md** — Env and CORS checklist for web ↔ server.

## Design

- **Fonts:** Instrument Serif (headings) + DM Sans (body)
- **Theme:** Dark (#0c0c0e bg, #c8a97e accent)
- **Status colours:** applied (blue), screening (amber), round1 (purple), round2 (gold), offer (green), rejected (red)
