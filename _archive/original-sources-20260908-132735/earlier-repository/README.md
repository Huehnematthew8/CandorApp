# Candor — AI Job Application Tracker

A minimal, dark-themed AI-powered job application tracker.

## Quick Start

### Frontend (static)

Open `index.html` in a browser, or serve it:

```bash
npx serve . -p 3000
```

Click "Skip to demo dashboard" to load the demo data.

### Next.js app (web/)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. See `web/GETTING_STARTED.md` for Supabase and full setup.

### Backend (optional)

The API is built but not yet connected to the frontend. To run it:

```bash
cd server
npm install
cp .env.example .env   # Add DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, GOOGLE_CLIENT_ID
npx prisma migrate dev
npm run dev
```

## Project Structure

- `index.html` — Single-file app with Board, All Jobs, My Story views
- `web/` — Next.js + Supabase + shadcn + Tailwind (Candor app)
- `server/` — Node.js + Express + Prisma + Anthropic

## Design

- **Fonts:** Instrument Serif (headings) + DM Sans (body)
- **Theme:** Dark luxury-minimal (#0c0c0e bg, #c8a97e accent)
- **Status colours:** draft, applied (blue), screening (amber), round1 (purple), round2 (gold), offer (green, pulsing), rejected (red)
