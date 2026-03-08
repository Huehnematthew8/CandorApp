# Candor API (Backend)

Express + Prisma API for auth, industries, companies, notes, contacts, resume, and email.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (local or hosted)

## 1. Install dependencies

```bash
cd server
npm install
```

## 2. Set up the database

### Option A: Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com) (Dashboard → New project).
2. In the project, go to **Settings → Database**.
3. Under **Connection string**, choose **URI** and copy the URL. Replace `[YOUR-PASSWORD]` with your database password (the one you set when creating the project, or reset under **Database → Database password**).
4. Use the **Session mode** (port **5432**) connection string for Prisma. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
   Or use the **Direct connection** (host `db.[project-ref].supabase.co`, port 5432) if shown—both work with Prisma.
5. Put this in `.env` as `DATABASE_URL` (see step 3 below), then run the migrations in step 4.

### Option B: Local PostgreSQL

Create a database (e.g. `candor`):

```bash
# macOS with Homebrew
createdb candor
```

Then use `postgresql://user:password@localhost:5432/candor` as `DATABASE_URL`.

## 3. Configure environment

Copy the example env and set at least `DATABASE_URL` and `JWT_SECRET`:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL URL (Supabase: from Settings → Database → Connection string URI) |
| `JWT_SECRET` | Yes | Random string for signing tokens (e.g. `openssl rand -hex 32`) |
| `CORS_ORIGIN` | No | Allowed origin (default `http://localhost:3000`) |
| `PORT` | No | API port (default `4000`) |
| `GEMINI_API_KEY` | For AI (free) | Free tier, no card. Get key at [Google AI Studio](https://aistudio.google.com/apikey). Resume/email AI. |
| `ANTHROPIC_API_KEY` | For AI (paid) | Alternative to Gemini for resume/email AI |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth client ID for Google sign-in |

## 4. Run Prisma migrations

Create tables and generate the Prisma client:

```bash
npx prisma migrate dev
```

If you prefer to push the schema without migration history (e.g. early dev):

```bash
npx prisma db push
npx prisma generate
```

## 5. Start the server

```bash
npm run dev
```

API runs at **http://localhost:4000**.

- **Health:** `GET /health` → `{ "ok": true }`
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
- **Applications (authenticated):** `GET/POST /api/applications/industries`, `GET/POST/PUT /api/applications/companies/:id`, notes, contacts, etc.

Use the returned `accessToken` in the `Authorization: Bearer <token>` header for protected routes.

## Getting sign-in and a fresh dashboard

1. **Database:** Run migrations (step 4 above) so `User`, `Industry`, `Company`, etc. exist.
2. **Server:** In `server`, set `DATABASE_URL` and `JWT_SECRET` in `.env`, then `npm run dev` (API on port 4000).
3. **Web:** In `web`, copy `.env.local.example` to `.env.local`. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your API URL). For Google sign-in, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same value as the server’s `GOOGLE_CLIENT_ID`.
4. **Run web:** From `web`, run `npm run dev` (e.g. port 3000 or 3002). Ensure the server CORS allows that origin (e.g. `CORS_ORIGIN="http://localhost:3000,http://localhost:3002"` in server `.env`).
5. **Sign up:** Open the app, go to Register, create an account (email + password). You’ll be redirected to the dashboard with an empty board.
6. **Use the app:** Click “Add Industry Group” in the sidebar, add a name (e.g. “Tech”), then “Add company” under that group. Select a company to draft emails, add notes, and contacts.

New users see an empty dashboard; data is stored per user in the database.

## Optional: seed data

You can add a seed script in `package.json` and run `npx prisma db seed` after defining seed logic in `prisma/seed.js` (see [Prisma seeding](https://www.prisma.io/docs/guides/database/seed-database)).
