# Candor — Product Requirements Document

**Version:** 3.0
**Last updated:** April 2026
**Status:** Active development — core MVP built and running
**Owner:** Matthew Huehne

---

## 1. What is Candor

Candor is a web application for job seekers that replaces the manual middle layer of a job search — the spreadsheets, scattered emails, and notes that most people currently use to track applications.

**Tagline:** Apply with intention, not volume.

**The core problem:** Job searching is mentally exhausting not because applying is hard, but because the administrative overhead is enormous. People manage applications across 5–6 different tools and constantly lose track of where things stand, what to do next, and why they wanted a role in the first place. Candor replaces all of that with one place that thinks alongside you.

**What makes it different:**

1. **Story-driven, not spreadsheet-driven.** The My Story profile — built from your resume and edited by you — powers AI email drafting, fit scoring, and narrative. You are not just logging applications; you are building a coherent picture of who you are and what you want.

2. **Pushes back on low-quality applications.** A required "why this role?" field on every job, a personalisation score on every email, and a nudge that says "always edit before sending" are deliberate friction points. Candor is explicitly not a spray-and-pray tool.

3. **Follows your process, not a fixed one.** Every company gets a custom stage pipeline built as you go — not a global Kanban board that breaks when one company has 5 rounds and another has 1.

4. **Channel-aware activity log.** Every touchpoint — email, call, portal submission, file sent — is logged in one unified place. The AI drafter only activates for written communication.

---

## 2. Target User

**Primary:** Recent graduates and early-career professionals (0–3 years experience) actively job searching. Applying to 10–50 roles over 3–6 months.

**Secondary:** Mid-career professionals changing roles.

**Profile:**
- Applying across multiple companies and industries simultaneously
- Managing a mix of email, phone, and portal-based communications
- Currently tracking in Google Sheets or not at all
- Willing to pay for genuine competitive advantage
- Primarily on desktop during active job search sessions
- Australian market primary, globally applicable

**What they care about most:**
1. Knowing where things stand without having to remember
2. Not missing follow-ups or opportunities
3. Writing emails that feel authentic, not AI-generated
4. Understanding which applications are worth prioritising
5. Feeling like they are making progress, not just sending into the void

---

## 3. Tech Stack

- **Framework:** Next.js App Router (TypeScript) — read `node_modules/next/dist/docs/` before writing any Next.js code; do not assume conventions from older versions
- **Styling:** CSS custom properties (design tokens) + inline styles. No Tailwind utility classes in components.
- **Auth + Database:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **State management:** Zustand (`src/store/useAppStore.ts`)
- **AI (local dev):** Ollama with `gemma2:2b` via `src/lib/ai.ts` — configured in `.env.local`
- **AI (production):** Anthropic API (`claude-sonnet-4-6`) — same interface, swap env vars
- **PDF parsing:** `pdf-parse@1.1.1` (server-side only, CJS require pattern — do NOT use ES import)
- **Hosting:** Vercel (free tier)
- **Fonts:** Plus Jakarta Sans (brand/headings) + DM Sans (body) from Google Fonts

**Critical rules:**
- All AI calls go through `src/lib/ai.ts` using `aiComplete` or `aiStream`. Never import any AI SDK directly in components or route handlers.
- `pdf-parse` must be required with `const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>` — not imported. v1.1.1 only (v2 has a different API).
- When calling `aiComplete` for structured JSON responses (resume parsing, JD analysis), always pass `{ maxTokens: 4000 }` — the default 1000 is not enough.

---

## 4. Design System

### Colour tokens (CSS custom properties, defined in `src/app/globals.css`)
```css
--bg:      #09090b   /* page background */
--s1:      #0f0f12   /* secondary surfaces */
--s2:      #151518   /* inputs, cards */
--s3:      #1c1c20   /* active states */
--s4:      #222227   /* hover on dark */

--t1:      #edeae3   /* primary text */
--t2:      #7c7985   /* secondary text */
--t3:      #46444c   /* placeholder / dim */

--gold:    #c9aa7e   /* primary accent */
--gold2:   #e3c99a   /* gold hover */
--gold3:   #f1dfc0   /* light gold */

--green:   #4ea375
--gd:      rgba(78,163,117,.1)
--blue:    #5d90d6
--bd:      rgba(93,144,214,.1)
--amber:   #d6905c
--ad:      rgba(214,144,92,.1)
--purple:  #8e74d6
--pd:      rgba(142,116,214,.1)
--red:     #c46060
--rdd:     rgba(196,96,96,.1)
--teal:    #4aacb0
--td:      rgba(74,172,176,.1)

--b1:      rgba(255,255,255,.05)  /* subtle border */
--b2:      rgba(255,255,255,.09)  /* normal border */
--b3:      rgba(255,255,255,.14)  /* strong border */

--glow:    rgba(201,170,126,.1)
--glow2:   rgba(201,170,126,.05)
```

### Status colours
| Status | Colour |
|--------|--------|
| saved | --t3 |
| applied | --blue |
| screening | --teal |
| interview / round1 | --amber |
| round2 | --purple |
| offer | --green |
| rejected | --red |

### Typography
- **Brand / headings:** `font-family: 'Plus Jakarta Sans', sans-serif` — use for the Candor wordmark, page titles, modal headings
- **Body / UI:** `font-family: 'DM Sans', sans-serif` — everything else
- Import both from Google Fonts in the root layout (`src/app/layout.tsx`)

### Candor brand mark
Every instance of the "Candor" wordmark must be accompanied by the `<WombatMascot>` component:
```tsx
<WombatMascot size={42} style={{ marginRight: '-4px' }} />
<span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-.03em' }}>Candor</span>
```
- Gap between mascot and text: `gap: '0px'` on the flex container (the negative margin does the work)
- Parent container must have `background: 'var(--bg)'` (or any explicit background) for `mix-blend-mode: multiply` to work correctly on the mascot PNG

### Design principles
- Dark theme only
- No purple gradients, no Inter font, no generic SaaS patterns
- Borders: always rgba, never solid colours
- Border radius: 7–13px on containers, 100px for pills/badges
- Animations: `up` keyframe (opacity 0→1 + translateY 10→0) on page transitions, `fade` for overlays, `spin` for loading spinners (all defined in `globals.css`)
- Micro-interactions on all hover states

### Loading screens
All full-page loading states (dashboard, story, login) use the same pattern:
```tsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', background: 'var(--bg)', animation: 'fade .3s ease both' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '4px' }}>
    <WombatMascot size={42} style={{ marginRight: '-4px' }} />
    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)' }}>Candor</span>
  </div>
  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', animation: 'spin .8s linear infinite' }} />
  <p style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 300 }}>Loading your [context]…</p>
</div>
```

---

## 5. Database Schema

```sql
-- Groups
create table groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  emoji text default '📁',
  position integer default 0,
  created_at timestamptz default now()
);

-- Jobs
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  group_id uuid references groups on delete set null,
  company text not null,
  role text not null,
  location text,
  salary text,
  logo text default '🏢',
  status text default 'saved',
  why text,
  applied_at date,
  saved_tone text default 'professional',
  fit integer default 0,
  active_stage_id uuid,
  notes jsonb default '[]',   -- stores Note[] objects, NOT text[]
  jd_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stages (custom pipeline per job)
create table stages (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs on delete cascade not null,
  name text not null,
  type text default 'other',
  position integer default 0
);

-- Interactions (unified log)
create table interactions (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs on delete cascade not null,
  channel text not null,
  subject text,
  body text,
  interacted_at timestamptz default now(),
  stage_id uuid references stages on delete set null
);

-- Contacts
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs on delete cascade not null,
  name text not null,
  role text,
  email text,
  phone text,
  initials text
);

-- Profiles (My Story)
create table profiles (
  user_id uuid references auth.users primary key,
  name text,
  title text,
  location text,
  narrative text,
  looking_for text,
  timeline jsonb default '[]',
  skills jsonb default '[]',
  strengths jsonb default '[]',
  observations jsonb default '[]',
  updated_at timestamptz default now()
);
```

All tables have Row Level Security enabled. Every policy checks `auth.uid() = user_id` or that the related job belongs to the user.

**Note on notes migration:** The `notes` column was originally `text[]`. It is now `jsonb` storing `Note[]` objects (`{ html: string; ts: string }`). The store normalises legacy string entries on load — any `string` in the array is converted to `{ html: string, ts: job.created_at }`.

---

## 6. TypeScript Types

```typescript
// src/types/index.ts

export type JobStatus =
  | 'saved' | 'applied' | 'screening' | 'interview'
  | 'round1' | 'round2' | 'offer' | 'rejected';

export type StageType =
  | 'default' | 'screening' | 'interview' | 'test'
  | 'task' | 'call' | 'portal' | 'offer' | 'custom' | 'other';

export type InteractionChannel =
  | 'email' | 'call' | 'message' | 'linkedin'
  | 'meeting' | 'note' | 'portal' | 'file';

export type Tone =
  | 'professional' | 'warm' | 'bold'
  | 'assertive' | 'enthusiastic' | 'grateful';

export type CommunicationType =
  | 'email' | 'cover-letter' | 'interview-prep' | 'call-prep';

export interface Note {
  html: string;   // rich HTML from RichEditor
  ts: string;     // ISO timestamp
}

export interface JobImportData {
  description: string | null;
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  team: string | null;
  reports_to: string | null;
  job_type: string | null;
  experience_level: string | null;
  deadline: string | null;
  company_about: string | null;
  culture_keywords: string[];
  tech_stack: string[];
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  position: number;
  created_at: string;
  jobs?: Job[];
}

export interface Job {
  id: string;
  user_id: string;
  group_id: string | null;
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  logo: string;
  status: JobStatus;
  why: string | null;
  applied_at: string | null;
  saved_tone: Tone;
  fit: number;
  active_stage_id: string | null;
  notes: Note[];           // NOT string[] — see Note interface above
  jd_summary: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations (populated by store, not in DB columns)
  group?: Group;
  stages?: Stage[];
  interactions?: Interaction[];
  contacts?: Contact[];
}

export interface Stage {
  id: string;
  job_id: string;
  name: string;
  type: StageType;
  position: number;
}

export interface Interaction {
  id: string;
  job_id: string;
  channel: InteractionChannel;
  subject: string | null;
  body: string | null;       // may contain HTML from RichEditor
  interacted_at: string;
  stage_id: string | null;
}

export interface Contact {
  id: string;
  job_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  initials: string | null;
}
```

---

## 7. File Structure

```
src/
  app/
    layout.tsx                      # root layout, fonts, CSS vars
    page.tsx                        # redirects to /dashboard or /login
    globals.css                     # all CSS custom properties + keyframe animations
    dashboard/
      page.tsx                      # wraps DashboardContent in ToastProvider
    login/
      page.tsx                      # email/password login with loading overlay
    signup/
      page.tsx
    story/
      page.tsx                      # wraps StoryPage in ToastProvider
    auth/
      callback/
        route.ts                    # Supabase auth callback (code exchange)
    api/
      ai/
        generate-email/
          route.ts                  # streaming email generation
        analyse-jd/
          route.ts                  # JD analysis → fit score + keywords
        parse-resume/
          route.ts                  # resume text/PDF → StoryData JSON
      import-url/
        route.ts                    # URL → job field extraction

  components/
    dashboard/
      TopNav.tsx                    # fixed nav: logo, URL import bar, stats, add job
      TableView.tsx                 # jobs table with sort/filter/search
      DetailView.tsx                # selected job: header + stage track + tabs
      overview/
        OverviewTab.tsx             # why, info grid, JD analysis, notes
        NextActionCard.tsx          # contextual next action prompt
        JDAnalysis.tsx              # paste JD → fit score + keywords
        NotesSection.tsx            # timestamped rich-text notes list
      activity/
        ActivityTab.tsx             # 3-column: log | drafter | insights
        InteractionLog.tsx          # scrollable list of logged interactions
        EmailDrafter.tsx            # AI email generator (streaming)
        CoverLetterDrafter.tsx      # AI cover letter generator
        LogView.tsx                 # view + inline-edit a logged interaction
        AIInsightsStrip.tsx         # contextual AI insight cards
        ContactsSection.tsx         # contacts list with add/edit/delete
        CallPrep.tsx                # call preparation view
        InterviewPrep.tsx           # interview prep view
        CommunicationMenu.tsx       # menu for selecting communication type
      modals/
        AddJobModal.tsx             # add job (with URL import prefill)
        AddStageModal.tsx           # add pipeline stage
        LogInteractionModal.tsx     # log interaction (rich text body)
        AddGroupModal.tsx           # create group
        BulkImportModal.tsx         # bulk job import

    story/
      StoryPage.tsx                 # My Story full page (profile, timeline, skills, etc.)

    ui/
      StatusBadge.tsx               # StatusBadge, StatusDropdown, StatusSequence exports
      StageTrack.tsx                # horizontal stage pipeline track
      Toast.tsx                     # ToastProvider + useToast hook
      RichEditor.tsx                # contenteditable with bold/italic/bullets (Cmd+B/I, Cmd+Shift+7)
      WombatMascot.tsx              # Candor mascot SVG/PNG component
      ParticleCanvas.tsx            # animated particle background (login page)
      EmojiPicker.tsx               # emoji picker for group/job logos
      ThemedSelect.tsx              # styled select input

  lib/
    ai.ts                           # provider-agnostic AI client (aiComplete, aiStream)
    supabase.ts                     # browser Supabase client
    supabase-server.ts              # server Supabase client
    read-generate-email-stream.ts   # SSE stream reader utility

  store/
    useAppStore.ts                  # Zustand store (all app state + Supabase mutations)

  types/
    index.ts                        # all shared TypeScript types

  middleware.ts                     # auth redirect middleware
  proxy.ts
```

---

## 8. Zustand Store (`src/store/useAppStore.ts`)

```typescript
interface AppState {
  // Data
  groups: Group[]           // includes a synthetic '__ungrouped' group when needed
  selectedJobId: string | null

  // UI
  loading: boolean
  error: string | null

  // Actions
  loadAllData: () => Promise<void>
  addGroup: (name: string, emoji?: string) => Promise<boolean>
  addJob: (groupId: string, data: Partial<Job>) => Promise<string>   // returns new job id
  deleteJob: (id: string) => Promise<void>
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>  // sets applied_at if transitioning to 'applied'
  updateJobWhy: (id: string, why: string) => Promise<void>
  updateJobSalary: (id: string, salary: string) => Promise<void>
  updateJobFit: (id: string, fit: number) => Promise<void>
  addNote: (jobId: string, note: string) => Promise<void>            // note is HTML string; stored as Note object with timestamp
  addStage: (jobId: string, data: { name: string; type: StageType }) => Promise<void>
  setActiveStage: (jobId: string, stageId: string) => Promise<void>
  addInteraction: (jobId: string, data: Partial<Interaction>) => Promise<void>
  updateInteraction: (jobId: string, interactionId: string, data: Partial<Pick<Interaction, 'subject' | 'body'>>) => Promise<void>
  addContact: (jobId: string, data: Partial<Contact>) => Promise<void>
  updateContact: (jobId: string, contactId: string, data: Partial<Contact>) => Promise<void>
  deleteContact: (jobId: string, contactId: string) => Promise<void>
  selectJob: (id: string | null) => void

  // Computed helpers
  getAllJobs: () => Job[]
  getJob: (id: string) => Job | undefined
}
```

**Data loading:** `loadAllData` fetches groups → jobs → stages/interactions/contacts in parallel, enriches jobs with relations, normalises legacy string notes, and creates a synthetic `__ungrouped` group if needed.

**All mutations:** Write to Supabase first, then update local state optimistically so the UI feels instant.

**Ungrouped jobs:** Jobs with `group_id = null` are collected into a synthetic group with `id: '__ungrouped'`. This group is filtered out of any UI that shows "real" groups (e.g. group count in TopNav uses `groups.filter(g => g.id !== '__ungrouped')`).

---

## 9. UI Components — Key Details

### `RichEditor` (`src/components/ui/RichEditor.tsx`)
A `contenteditable` div with keyboard formatting support. Used in: "Why this role", Notes, LogInteractionModal body, LogView edit mode.

**Keyboard shortcuts:**
- `Cmd/Ctrl+B` → bold
- `Cmd/Ctrl+I` → italic
- `Cmd/Ctrl+Shift+7` (or `Cmd+Shift+8`) → toggle unordered list

**Enter key behaviour:**
- Inside a list item: creates a new `<li>` (custom DOM manipulation — browser native is unreliable)
- Empty list item + Enter: exits list, inserts a new `<div>` after the `<ul>`
- Outside a list: default browser behaviour (new div/br)

**Props:** `defaultValue?: string` (HTML), `onBlur?: (html: string) => void`, `onChange?: (html: string) => void`, `placeholder?: string`, `style?: React.CSSProperties`

**Important:** Content is set only on mount (via `useEffect` with `key={job.id}` on the parent) — never on every render. This avoids cursor-jumping conflicts with `dangerouslySetInnerHTML`.

### `StatusBadge` exports (`src/components/ui/StatusBadge.tsx`)
Three exports:
- `StatusBadge` — read-only pill with coloured dot (used in TableView)
- `StatusDropdown` — clickable dropdown to change status (exists but currently replaced by StatusSequence in DetailView)
- `StatusSequence` — horizontal row of all 8 statuses; current is highlighted with dot + colour, past are dimmed/transparent, future are ghost borders. Click any to set status. Used in DetailView.

### `Toast` (`src/components/ui/Toast.tsx`)
- `ToastProvider` must wrap any page/component that calls `useToast()`
- The default context value is a no-op — missing `ToastProvider` will silently swallow all toasts
- Pages that use toasts: `dashboard/page.tsx` and `story/page.tsx` both wrap their content in `<ToastProvider>`

### `WombatMascot` (`src/components/ui/WombatMascot.tsx`)
- Uses `mix-blend-mode: multiply` to make the PNG background transparent
- This only works when the parent has an explicit non-transparent background (e.g. `var(--bg)`)
- Standard usage: `size={42}` with `marginRight: '-4px'` and parent gap `0px`

---

## 10. Application Pages

### Root (`/`)
Redirects to `/dashboard` if authenticated, `/login` if not.

### Login (`/login`)
- Email + password, Supabase `signInWithPassword`
- Animated particle canvas background (`<ParticleCanvas />`)
- Loading overlay on submit: Candor brand mark + spinner + cycling messages
- Links to `/signup`

### Signup (`/signup`)
- Email + password + confirm password
- Supabase `signUp`
- On success: "Check your email to confirm" message

### Middleware (`src/middleware.ts`)
- Unauthenticated → `/dashboard` or `/story` redirects to `/login`
- Authenticated → `/login` or `/signup` redirects to `/dashboard`
- Public routes: `/login`, `/signup`, `/auth/callback`

### Auth Callback (`/auth/callback`)
Exchange code for session, redirect to `/dashboard`.

---

## 11. Dashboard Page

The dashboard is a single page (`/dashboard`) that renders either the **table view** or the **detail view** depending on whether a job is selected. No sidebar. Full viewport width.

### Top Navigation (`TopNav.tsx`)
Fixed at top, 52px height.

**Left:** Candor brand mark (mascot + wordmark). Clicking deselects any job and returns to table view.

**Centre:** URL import bar — input with link icon + "Import" button. URL validation on submit:
- Auto-prepends `https://` if no protocol
- Validates with `new URL()` constructor — toasts "Please enter a valid job listing URL" if invalid
- On valid URL: calls `POST /api/import-url`, shows loading state, then opens Add Job modal with pre-filled fields

**Right:**
- Bulk import button
- Add Group button (only shown if ≥1 group exists)
- Stats: Applied · Interviews · Offers
- Add Job button (gold pill)
- Avatar with initials → dropdown: My Story / Settings

### Table View (`TableView.tsx`)
Default state. Full width.

**Toolbar:** "Applications" title · count badge · filter pills (All / Saved / Applied / Interview / Offer / Rejected) · search input

**Columns:** Company (logo + name + role) · Group pill · Status badge · Days · Location · Salary · Last Activity · Fit score

Clicking a row selects that job and opens Detail View.

### Detail View (`DetailView.tsx`)
Replaces table. Slides in (`slidein` animation).

**Breadcrumb:** `← Applications / CompanyName · GroupEmoji GroupName`

**Header:** Logo emoji · Company (Instrument Serif) · Role · Location · Salary (inline edit) · Log button · `StatusSequence` component (replacing old dropdown)

**Stage track:** Horizontal scrollable, custom stages per job, active stage highlighted gold.

**Two tabs:** Overview | Activity

---

## 12. Overview Tab (`OverviewTab.tsx`)

Components in order:

1. **Next Action Card** — conditional, gold-tinted, context-aware CTA
2. **Follow-up Warning Banner** — shown if `applied` status + 10+ days
3. **Why This Role** — `<RichEditor key={job.id}>` with gold label. Saves on blur via `updateJobWhy`. Required field.
4. **Info Grid** — Status sequence · Applied date · Location · Salary
5. **JD Analysis** (`JDAnalysis.tsx`) — paste JD → fit score ring + keyword pills + angle
6. **Notes** (`NotesSection.tsx`) — `<RichEditor>` input (Enter to save, Shift+Enter new line) + saved notes as cards with relative timestamps

### Notes format
Notes are stored as `Note[]` on the job:
```typescript
interface Note {
  html: string;   // HTML from RichEditor (may contain <b>, <i>, <ul><li>)
  ts: string;     // ISO timestamp
}
```
When displaying notes, render `note.html` with `dangerouslySetInnerHTML`. Timestamp displayed as relative string (just now / 2h ago / 3d ago / date).

When accessing notes for AI prompts, strip HTML tags: `note.html.replace(/<[^>]*>/g, '')`.

---

## 13. Activity Tab (`ActivityTab.tsx`)

Three-column flex layout.

### Left: Interaction Log (210px, `InteractionLog.tsx`)
- Header: "All interactions" + Log button
- Scrollable list: channel icon + type + subject + date
- Clicking opens in centre column

**Channels:** `email` | `call` | `message` | `linkedin` | `meeting` | `note` | `portal` | `file`

**Channel colours:** email→blue · call→green · message→teal · linkedin→blue · meeting→purple · note→amber · portal→purple · file→amber

### Centre: Drafter / Log View (flex: 1)
- Email channel → `EmailDrafter.tsx` (streaming AI generation)
- Cover letter → `CoverLetterDrafter.tsx`
- Interview prep → `InterviewPrep.tsx`
- Call prep → `CallPrep.tsx`
- Non-drafter interaction selected → `LogView.tsx` (view + inline edit with `RichEditor`)

**LogView inline editing:** Edit/Save/Cancel buttons. Subject: plain `<input>`. Body: `<RichEditor>`. Saves via `updateInteraction` store action. Body rendered with `dangerouslySetInnerHTML` when it contains HTML tags.

**Contacts** (`ContactsSection.tsx`): pinned to bottom of centre column. Contact cards with initials avatar, name, role, email, phone. Add/edit/delete supported. `updateContact` and `deleteContact` store actions.

### Right: AI Insights Strip (172px, `AIInsightsStrip.tsx`)
Contextual insight cards (ANGLE / TONE / MATCH / HOOK / LEVERAGE / TIMING). Quick edit buttons call generate-email with refinement instruction.

---

## 14. AI API Routes

### `POST /api/ai/generate-email`
Streaming. Returns `text/event-stream`. Uses `aiStream` from `src/lib/ai.ts`.

**Request:** `{ company, role, stage: JobStatus, tone: Tone, why, narrative? }`

**System prompt:** Professional writing assistant. No clichés. First person. Under 200 words. Clear next step.

### `POST /api/ai/analyse-jd`
Non-streaming. Returns JSON. Uses `aiComplete` with `{ maxTokens: 4000 }`.

**Request:** `{ jobDescription, company, role, userSkills? }`

**Response:** `{ fitScore: number, matched: string[], gaps: string[], angle: string }`

### `POST /api/import-url`
Non-streaming. Server-side fetch + HTML text extraction + AI extraction.

**Request:** `{ url: string }`

**Response:** `{ company, role, location, salary }` (all nullable)

Note: LinkedIn blocks server-side fetch — return nulls gracefully, let the Add Job modal fall back to manual entry.

### `POST /api/ai/parse-resume`
Non-streaming. Handles both PDF upload and plain text.

**Content-type `multipart/form-data`:** Receives file, extracts text with `pdf-parse@1.1.1`, passes to AI.

**Content-type `application/json`:** Receives `{ resumeText: string }`.

**Response:** Full `StoryData` JSON object (name, title, location, narrative, lookingFor, timeline, skills, strengths, observations).

**Always use `{ maxTokens: 4000 }`** — the full JSON structure requires more than the 1000 default.

---

## 15. My Story Page (`/story`)

Accessible from avatar dropdown in TopNav. Has its own `<ToastProvider>` wrapper in `src/app/story/page.tsx`.

**Loading state:** Shows Candor loading screen (same pattern as dashboard) while fetching profile from `profiles` table.

### Nav
Candor brand mark (left) · "/ My Story" breadcrumb · Saved/Saving indicator · Dashboard back button

### Header
- Avatar circle (gradient initials)
- Editable name (Plus Jakarta Sans, 28px, transparent input)
- Editable job title + location (inline, secondary colour)
- Resume import button → file input (`.pdf, .txt, .md`)
  - PDF: sends as `FormData` to `POST /api/ai/parse-resume`
  - Text/MD: reads as text, sends as JSON to same route
- "Paste text" toggle → textarea + analyse button

### Profile sections (all editable inline)
- **Narrative** — "Tell your story" — textarea, saves on blur
- **Looking For** — textarea, saves on blur
- **Timeline** — chronological entries (year, role, company, detail). Edit inline, add/remove entries.
- **Skills** — name + level (50–95). Edit inline, add/remove.
- **Strengths** — exactly 3 (title + desc). Edit inline.
- **Observations** — 2–4 actionable career tips. Edit inline, add/remove.

All data persists to `profiles` table via debounced upsert (600ms after last change).

---

## 16. Status Labels and Colours

```typescript
const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  round1: 'Round 1',
  round2: 'Round 2',
  offer: 'Offer',
  rejected: 'Rejected',
};

const STATUS_COLOURS: Record<JobStatus, string> = {
  saved: 'var(--t3)',
  applied: 'var(--blue)',
  screening: 'var(--teal)',
  interview: 'var(--amber)',
  round1: 'var(--amber)',
  round2: 'var(--purple)',
  offer: 'var(--green)',
  rejected: 'var(--red)',
};
```

Both exported from `src/components/ui/StatusBadge.tsx`.

---

## 17. Error Handling

- **AI unavailable** (Ollama not running / API key out of credits): Show inline error in drafter. Do not crash the page.
- **URL import fails** (LinkedIn blocks, network error): Toast "Couldn't fetch that URL — fill in details manually". Pre-fill only the URL field in the modal.
- **Invalid URL in import bar**: Toast "Please enter a valid job listing URL" before making any fetch.
- **Supabase error**: `useAppStore` sets `error` state; dashboard page shows it as a toast via `useEffect`.
- **Resume parse fails**: Toast the error message. Page stays functional.
- **All loading states**: Show spinner or the full Candor loading screen. Never show a blank/null screen mid-load.
- **Missing `ToastProvider`**: `useToast` returns a no-op by default — always wrap pages that show toasts.

---

## 18. Monetisation (context only, not MVP scope)

**Free tier:** Unlimited job tracking, unlimited interactions/notes, custom pipelines, 10 AI generations/month, My Story.

**Candor Pro ($19/month or $99/year):** Unlimited AI generations, Gmail scanning, JD analysis, AI insights, analytics.

**Rule:** Never lock content a user created on the free tier. Show clear upgrade prompt at generation limit — never break the UI.

---

## 19. Key UX Decisions

**No sidebar.** Removed — the table view shows all jobs with status, group, and last activity.

**`StatusSequence` in Detail View.** The status row in DetailView shows all 8 statuses horizontally — current highlighted, past dimmed, future ghost. Clicking any pill updates status immediately. Replaces the old dropdown. More scannable and requires fewer clicks.

**`RichEditor` for all writing fields.** "Why this role", Notes, interaction body, and LogView edit mode all use the same `RichEditor` component. Supports bold/italic/bullets with keyboard shortcuts only (Notion-style). No toolbar.

**Notes as structured objects.** `Note { html, ts }` instead of `string[]`. Enables relative timestamps ("2h ago") per note without a separate table.

**Required "why" field.** Intentional friction. Forces intentionality before adding a job. Creates data the AI uses for drafting.

**Two tabs only (Overview + Activity).** Notes live in Overview. Contacts live in Activity. Four tabs created artificial friction.

**Full-width detail view.** When a job is open, it gets the entire viewport. The three-column Activity layout needs horizontal space.

**"Always edit" nudge.** Shown above the email drafter every time. Candor's positioning is authentic applications.

---

## 20. Planned Features (Not Yet Built)

### Browser Extension — "Save to Candor"
Highest-priority feature after MVP.

- Manifest V3 Chrome extension
- Popup extracts job details from current tab (via `/api/import-url` or direct DOM scraping)
- Same Add Job modal design language
- Auth: share Supabase session with web app
- Store in `/extension/` at repo root
- Priority boards: LinkedIn, Seek, Greenhouse, Lever, Indeed

### Gmail Integration
Currently simulated (no real OAuth). Future: real Gmail OAuth → inbox scan → suggested status updates.

### Analytics
Application funnel visualisation, response rate tracking, time-to-offer metrics.

---

## 21. What This Document Is

This is the single source of truth for building Candor. When in conflict with any other instruction or prior context, this document takes precedence.

Every AI coding session should begin with: "Read CANDOR_PRD.md fully. Build exactly what it describes."
