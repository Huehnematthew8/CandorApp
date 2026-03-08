# Candor — AI Job Application Tracker

A minimal, dark-themed AI-powered job application tracker: auth, dashboard, My Story (profile), resume upload, and AI-generated emails.

## Who runs the backend?

- **Local development:** Anyone who clones the repo runs the backend on their own machine (`cd server && npm run dev`). Your co-founder (or any dev with GitHub access) clones the repo, sets up `.env` (see below), and runs both the server and the web app locally. There is no shared “live” server unless you deploy one.
- **Shared app (optional):** To have one app and database that you and your co-founder both use without running the backend on your machine, deploy the backend (and optionally the web app) to a host (e.g. [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)). Then set `NEXT_PUBLIC_API_URL` to that deployed API URL so the web app talks to the same backend.

## Quick start (anyone cloning this repo)

### 1. Backend (required for auth and real data)

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`: set at least `DATABASE_URL` (PostgreSQL) and `JWT_SECRET`. See **server/README.md** for full options (Supabase, CORS, Gemini/Anthropic, Google sign-in).

```bash
npx prisma migrate dev
npm run dev
```

API runs at **http://localhost:4000**.

### 2. Web app

```bash
cd web
npm install
cp .env.local.example .env.local
```

Edit `web/.env.local`: set `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your API URL). For Google sign-in, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to match the server’s `GOOGLE_CLIENT_ID`.

```bash
npm run dev
```

Open **http://localhost:3000** (or the port shown). Register or log in and use the dashboard.

### 3. CORS

If the web app runs on a different port (e.g. 3002), add it in `server/.env`:

```bash
CORS_ORIGIN="http://localhost:3000,http://localhost:3002"
```

## Project structure

- **web/** — Next.js 14 (App Router), Tailwind, shadcn/ui. Login, register, dashboard, My Story, board, tracker.
- **server/** — Express + Prisma + PostgreSQL. Auth (JWT, Google), industries/companies, profile, resume upload, email AI (Gemini or Anthropic).

See **server/README.md** for detailed API and env setup. See **WEB_SERVER_SYNC.md** for how web and server stay in sync.

## Design

- **Fonts:** Instrument Serif (headings) + DM Sans (body)
- **Theme:** Dark (#0c0c0e bg, #c8a97e accent)
- **Status colours:** draft, applied (blue), screening (amber), round1 (purple), round2 (gold), offer (green), rejected (red)
