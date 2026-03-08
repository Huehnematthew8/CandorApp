# Getting Candor Functioning

Follow these steps to go from "demo only" to a working app with real auth and data.

---

## 1. Run the app locally (you may already have this)

From the **project root** (the folder that contains `web/` and `server/`):

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**. You’ll see the onboarding page; click **Continue to Dashboard** or **Skip to demo dashboard**. The app works with **in-memory demo data** only until you complete the steps below.

---

## 2. Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **New project**.
3. Pick an organization, name (e.g. `candor`), database password, and region. Create the project.
4. Wait for the project to finish provisioning.

---

## 3. Add the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Click **New query**.
3. Copy the full contents of **`web/supabase/schema.sql`** from this repo and paste into the editor.
4. Click **Run**. You should see success; this creates `industries`, `companies`, `contacts`, `notes` and RLS policies.

---

## 4. Get your API keys and env vars

1. In Supabase, go to **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL**
   - **anon public** key (under "Project API keys")
3. In the Candor repo, inside **`web/`**, create a file named **`.env.local`** (if it doesn’t exist).
4. Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual URL and anon key. Restart the dev server after saving (e.g. stop with Ctrl+C and run `npm run dev` again).

---

## 5. Turn on Auth (email sign up / login)

1. In Supabase: **Authentication** → **Providers**.
2. Ensure **Email** is enabled (it usually is). Optionally enable **Google** or others.
3. Under **Authentication** → **URL Configuration** set:
   - **Site URL**: `http://localhost:3000` (for local dev)
   - **Redirect URLs**: add `http://localhost:3000/**` and (when you deploy) your production URL, e.g. `https://yourdomain.com/**`

The app already has Supabase client and middleware set up. To make the app “functioning” with real users you still need to add:

- A **login/signup page** that calls `supabase.auth.signUp()` / `signInWithPassword()`.
- **Protected dashboard**: redirect to login when there’s no session.
- **Data from Supabase**: load industries/companies for the logged-in user instead of demo data.

---

## 6. Wire the UI to Supabase (what “functioning” means)

| Feature | Current state | To make it work |
|--------|----------------|------------------|
| **Auth** | None (everyone sees demo) | Add `/login` and `/signup`; use `supabase.auth.signUp()` / `signInWithPassword()`; store session via Supabase SSR. |
| **Dashboard data** | Demo data in memory | Replace `DEMO_INDUSTRIES` (and related state) with `supabase.from('industries').select('*, companies(*, contacts(*), notes(*))')` and similar for companies. |
| **Saving changes** | Not persisted | On add/edit/delete of industry, company, note, contact call `supabase.from('...').insert()` / `.update()` / `.delete()`. |
| **Resume upload** | Placeholder | Use Supabase Storage for file upload; optionally an Edge Function or external API to parse PDF and fill profile. |
| **AI email** | Not connected | Call an API (e.g. Vercel serverless or Supabase Edge Function) that uses Anthropic/OpenAI to generate text; show result in the email tab. |

---

## 7. Quick path: auth + one industry

To get to “functioning” quickly:

1. **Auth**  
   - Add a page at `app/login/page.tsx` (and optionally `app/signup/page.tsx`) with a form that calls `supabase.auth.signInWithPassword()` or `signUp()`.  
   - In dashboard layout (or middleware), check `supabase.auth.getUser()`. If no user, redirect to `/login`.

2. **Data**  
   - After login, fetch industries (with companies) with RLS; the schema already restricts rows by `auth.uid()`.  
   - Replace the initial state in your board/tracker views with this fetched data.  
   - On “Add industry” / “Add company” / save note or contact, call the corresponding Supabase `insert` / `update` / `delete`.

Once auth works and at least one industry/company loads and saves from Supabase, the app is “functioning” end-to-end. Resume parsing and AI email can be added next.

---

## 8. Deploy (optional)

- **Vercel**: Connect your repo, set root to `candor/web` (or the repo root and set root in project settings), add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Environment Variables. In Supabase, add your production URL to Redirect URLs.
- **Other hosts**: Build with `npm run build`, run `npm run start`. Set the same env vars and Supabase redirect URLs for your production domain.

---

## Summary checklist

- [ ] Node 18+ and `npm run dev` works
- [ ] Supabase project created
- [ ] `schema.sql` run in SQL Editor
- [ ] `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Auth URLs configured in Supabase (Site URL + Redirect URLs)
- [ ] Add login/signup pages and protect dashboard
- [ ] Replace demo data with Supabase queries and mutations

After that, the app is functioning with real users and persisted data.
