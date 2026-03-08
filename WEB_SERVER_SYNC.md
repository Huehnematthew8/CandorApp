# Web ↔ Server sync checklist

Use this to keep the **web** (Next.js) and **server** (Express API) in sync.

## API alignment ✓

| Web calls | Server route | Status |
|-----------|--------------|--------|
| `POST /api/auth/register` | `auth.js` | ✓ |
| `POST /api/auth/login` | `auth.js` | ✓ |
| `POST /api/auth/google` | `auth.js` | ✓ |
| `GET /api/applications/industries` | `applications.js` | ✓ |
| `POST /api/applications/industries` | `applications.js` | ✓ |
| `POST /api/applications/industries/:id/companies` | `applications.js` | ✓ |
| `PUT /api/applications/companies/:id` | `applications.js` | ✓ |
| `POST /api/applications/companies/:id/notes` | `applications.js` | ✓ |
| `POST /api/applications/companies/:id/contacts` | `applications.js` | ✓ |
| `POST /api/email/generate` | `email.js` | ✓ |
| `POST /api/email/refine` | `email.js` | ✓ |

## Env: keep these in sync

**Server** (`server/.env`):

- `PORT` — default `4000` (web expects this unless you override).
- `CORS_ORIGIN` — must include the URL where the web app runs, e.g.  
  `http://localhost:3000` or `http://localhost:3000,http://localhost:3002` if Next runs on 3002.
- `GOOGLE_CLIENT_ID` — your OAuth Web client ID.

**Web** (`web/.env.local` — copy from `web/.env.local.example` if you don’t have it):

- `NEXT_PUBLIC_API_URL` — must be the server URL, e.g. `http://localhost:4000`.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — **same value** as server `GOOGLE_CLIENT_ID`.

## Quick checks

1. **Server base URL**  
   Web uses `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`). Server runs on `PORT` (default 4000). They must match.

2. **CORS**  
   If the app is at `http://localhost:3002`, set in `server/.env`:  
   `CORS_ORIGIN="http://localhost:3000,http://localhost:3002"`  
   (or omit `CORS_ORIGIN` to use the server default: 3000 and 3002.)

3. **Web env file**  
   Next.js only reads `.env.local` (or `.env`). If you haven’t created `web/.env.local`, copy `web/.env.local.example` and set at least `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
