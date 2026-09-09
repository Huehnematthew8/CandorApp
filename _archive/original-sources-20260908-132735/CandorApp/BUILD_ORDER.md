# Candor — Build Order & Claude Code Prompts

> **How to use this file:** Work through each phase in order. Each step has the exact prompt to paste into Claude Code. Don't skip ahead — each step depends on the one before it. After each prompt, review the changes, test in the browser, and fix any issues before moving on.
>
> **Before every session:** If Claude Code doesn't have context from a previous session, start with:
> "Read CANDOR_SPEC.md — this is the full product spec. Read BUILD_ORDER.md — I'm on Phase [X], Step [Y]."

---

## Pre-work (You do this manually, not Claude Code)

### P1. Create the project folder
```bash
mkdir candor
cd candor
```

### P2. Create a Supabase project
1. Go to https://supabase.com → New Project
2. Pick a name (e.g. "candor"), set a database password, choose a region close to you (Sydney)
3. Once created, go to Settings → API and copy:
   - Project URL → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY`

### P3. Get a Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Create a key → this is `GEMINI_API_KEY`

### P4. Drop your spec files into the project folder
- Copy `CANDOR_SPEC.md` into the `candor/` folder
- Copy this file (`BUILD_ORDER.md`) into the `candor/` folder

### P5. Open in VS Code and start Claude Code
- Open the `candor/` folder in VS Code
- Click the Spark icon (Claude Code) in the sidebar
- You're ready to go

---

## Phase 1: Foundation

### Step 1.1 — Project Setup

**Prompt:**
```
Read CANDOR_SPEC.md. Set up a new Next.js 14 project with App Router and TypeScript in this directory. Install and configure:
- Tailwind CSS
- shadcn/ui (init with the default config, dark theme)
- @supabase/supabase-js and @supabase/ssr
- lucide-react
- @dnd-kit/core and @dnd-kit/sortable

Create a .env.example file with all the environment variables from section 12 of the spec. Create a .env.local file with the same keys but empty values (I'll fill them in).

Set up the folder structure:
- src/app/ (App Router pages)
- src/components/ (shared components)
- src/components/ui/ (shadcn components)
- src/lib/ (utilities, supabase client, ai service)
- src/hooks/ (custom hooks)
- src/types/ (TypeScript types)

Don't build any pages or features yet — just the clean foundation.
```

**After this step:** Fill in your `.env.local` with the Supabase and Gemini keys from pre-work.

---

### Step 1.2 — Design System & Global Styles

**Prompt:**
```
Read CANDOR_SPEC.md section 4 (Design System). Set up the complete dark theme in globals.css using CSS variables exactly as specified — all the color tokens, surfaces, borders, text colors, accent, status colors. Import DM Sans and DM Serif Display from Google Fonts in the layout. Set up the base styles: dark background, themed scrollbars, default font, transition defaults. Create a cn() utility using clsx + tailwind-merge in lib/utils.ts. Make sure the body has the --bg background color and --text as default text color.
```

---

### Step 1.3 — Database Schema

**Prompt:**
```
Read CANDOR_SPEC.md section 5 (Data Model). Create a file called supabase/schema.sql that contains the complete database schema — all tables, enums, indexes, and RLS policies. Use the exact table and column names from the spec. The status enum should be: draft, applied, interviewing, offer, rejected. Every table with user data needs a user_id column and an RLS policy that restricts select/insert/update/delete to rows where user_id matches auth.uid(). Also create a supabase/seed.sql with some sample data for one test user (we'll use this later for development).
```

**After this step:** Go to your Supabase dashboard → SQL Editor → paste and run schema.sql.

---

### Step 1.4 — Supabase Client & Auth Helpers

**Prompt:**
```
Read CANDOR_SPEC.md sections 3 and 9. Create the Supabase client setup:
- lib/supabase/client.ts — browser client (uses NEXT_PUBLIC keys)
- lib/supabase/server.ts — server client for API routes (uses service role key)
- middleware.ts — protects all /dashboard/* routes, redirects unauthenticated users to /login, refreshes session

Also create src/types/database.ts with TypeScript types that match the schema — Industry, Company, Email, Note, Contact, InterviewPrep, ActivityLog, Profile, and the JobStatus enum type.
```

---

### Step 1.5 — TypeScript Types & Constants

**Prompt:**
```
Read CANDOR_SPEC.md sections 4 and 5. Create src/lib/constants.ts with:
- STATUS_ORDER array: ['draft', 'applied', 'interviewing', 'offer', 'rejected']
- STATUS_LABELS map: { draft: 'Draft', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected' }
- STATUS_COLORS map with dot color, pill bg, and pill text for each status (from the design system)
- Status change messages from section 8 (micro-feedback)
- Any other shared constants from the spec

Make sure these are the single source of truth — every component references these, never hardcodes status values.
```

---

## Phase 2: Auth & Layout

### Step 2.1 — Auth Pages

**Prompt:**
```
Read CANDOR_SPEC.md section 9. Build the auth pages:
- src/app/login/page.tsx — email/password login form + Google sign-in button + link to signup
- src/app/signup/page.tsx — email/password registration + Google sign-in + link to login
- Both pages should use the dark theme, be centered on the page, show the "Candor" brand in DM Serif Display at the top, and have clean minimal forms matching the design system (surface2 background cards, accent-colored buttons)
- On successful auth, redirect to /dashboard
- Show error messages inline (e.g., "Invalid credentials", "Email already registered")
- Use Supabase Auth for all auth operations (signInWithPassword, signUp, signInWithOAuth for Google)
```

---

### Step 2.2 — Landing Page

**Prompt:**
```
Build a landing page at src/app/page.tsx. This is the public page people see before signing in. Keep it minimal and striking:
- Hero section: "Candor" in large DM Serif Display, tagline "Apply authentically at scale", brief 2-sentence description, two CTA buttons: "Get Started" (→ /signup) and "Log In" (→ /login)
- Use the dark theme. The page should feel premium and intentional — generous whitespace, gold accent on the CTAs, subtle background texture or gradient
- No feature list, no pricing, no footer links for now — just the hero. We'll expand later.
- Make sure unauthenticated users who hit /dashboard get redirected here
```

---

### Step 2.3 — Dashboard Layout & Sidebar

**Prompt:**
```
Read CANDOR_SPEC.md sections 6.1 (Sidebar) and the navigation structure. Build the dashboard layout:
- src/app/dashboard/layout.tsx — the shell for all dashboard pages. Fixed sidebar on the left (240px), main content area on the right.
- Sidebar component (src/components/sidebar.tsx):
  - "Candor" brand (DM Serif Display) + "Authenticity-first" tagline in text-dim
  - Navigation tabs: Today, Board, All Jobs, Analytics, My Story — each links to its route. Active tab is highlighted with surface3 background.
  - Industry groups section (empty for now — we'll populate with real data in Phase 3)
  - Search bar (non-functional placeholder for now)
  - Quick Add button at the bottom with "⌘K" badge
  - User section at the bottom: avatar + name from Supabase auth + settings icon
- Placeholder pages for each route: /dashboard (Today), /dashboard/board, /dashboard/jobs, /dashboard/analytics, /dashboard/profile — each just shows the page name for now
- The sidebar should use the design system surfaces and borders. Transitions on hover for nav items.
- Cmd/Ctrl+K should open a Quick Add modal (build the modal as an empty placeholder for now)
```

---

## Phase 3: Data Layer & Core Context

### Step 3.1 — Data Hooks

**Prompt:**
```
Create custom hooks that handle all Supabase data operations for the app. These hooks are the single source of truth — all components read from and write through these hooks.

- src/hooks/useIndustries.ts — fetches all industries with their companies for the current user. Returns { industries, loading, error, refetch }. Companies should be nested inside their industry. Sorted by display_order.
- src/hooks/useCompany.ts — fetches a single company by ID with its emails, notes, contacts, interview prep, and activity log. Returns { company, emails, notes, contacts, interviewPrep, activities, loading, error, refetch }.
- src/hooks/useProfile.ts — fetches and updates the current user's profile.
- src/hooks/useMutations.ts — provides mutation functions: addIndustry, updateIndustry, deleteIndustry, addCompany, updateCompany, deleteCompany, addNote, addContact, addEmail, updateStatus, addActivity. Each function should do an optimistic update (update local state immediately) and then sync with Supabase. On failure, refetch to restore server state and show an error toast.

Use React context (src/contexts/IndustriesContext.tsx) to provide industries data globally so both the sidebar and main content can access it without prop drilling.
```

---

### Step 3.2 — Sidebar with Real Data

**Prompt:**
```
Update the sidebar to use real data from IndustriesContext:
- Industry groups: show each industry with emoji + name + company count, collapsible (toggle is_open)
- Companies under each industry: status dot (colored per STATUS_COLORS) + company name + role (truncated). Clicking a company navigates to /dashboard/board?company=[id]
- Search bar: filters companies by name, role, or location across all industries in real-time
- Add a "+" button next to the Industries heading that opens an "Add Industry" modal (name + emoji picker)
- Right-click or ⋯ menu on industries: Rename, Delete (with confirmation)
- Right-click or ⋯ menu on companies: Edit, Move to industry, Delete (with confirmation)
- If no industries exist, show an empty state: "Add your first industry group to get started"
- Make sure the sidebar scrolls independently if the list is long (overflow-y-auto with themed scrollbar)
```

---

### Step 3.3 — Quick Add Modal

**Prompt:**
```
Read CANDOR_SPEC.md section 6.10 (Quick Add). Build the full Quick Add modal:
- Triggered by Cmd/Ctrl+K globally or the sidebar button
- Fields: Company name (required) OR Job URL, Role (optional), Industry (dropdown of existing industries or "Create new")
- If the user enters a URL: for now, just save it as jd_url on the company. We'll add AI parsing later.
- On submit: creates the company in the selected industry with "draft" status, closes modal, sidebar updates immediately (optimistic), toast confirms "Added [Company] → [Industry]"
- Enter key submits, Escape closes
- The modal should appear centered with a backdrop blur, matching the design system (surface2 card, accent submit button)
- Auto-focus on the company name field when opened
```

---

## Phase 4: Core Screens

### Step 4.1 — Today View

**Prompt:**
```
Read CANDOR_SPEC.md section 6.2 (Today View). Build the complete Today View at /dashboard/page.tsx. This is the default landing screen.

- Greeting: "Good [morning/afternoon/evening], [Name]" using the user's profile name or email. Show today's date.
- Stats row: 4 cards in a grid — Total Applications (count all), Active (not rejected/offer), Interviews (status = interviewing), Response Rate (% that moved past applied)
- Today's Focus: a prioritized list of action items generated from the data, using the priority logic from the spec:
  1. Overdue next_action_due
  2. Due today
  3. Upcoming interviews with incomplete prep
  4. Pending offers
  5. Stale applications (applied 7+ days, no activity)
  6. Drafts with written emails ready to send
  7. Encouragement if no apps this week
  Each item shows an icon, description, and action button. Clicking navigates to that company.
  Dismissing removes it for the session (store dismissed IDs in local state, not DB).
- Recent Activity: last 5 entries from activity_log across all companies
- All done state: "You're all caught up. Nice work." with a subtle illustration or icon
- Use the design system cards (surface background, border, rounded-lg), stat numbers in large bold text
```

---

### Step 4.2 — Board View (Company Detail)

**Prompt:**
```
Read CANDOR_SPEC.md section 6.3 (Board View). Build the Board View at /dashboard/board/page.tsx.

Layout:
- The sidebar (already built) shows industries and companies on the left
- The main area shows the Company Detail Panel for the selected company
- If no company is selected (no ?company= param), show an empty state: "Select a company from the sidebar, or add one with ⌘K"
- Read the company ID from the URL search params

Company Detail Panel:
- Header section:
  - Company name (large, DM Serif Display), role below it
  - Status pill with dropdown to change status (updates via mutation, shows micro-feedback toast from section 8)
  - If status is "interviewing", show interview round badge (editable)
  - Applied date (or "Not yet applied" if draft)
  - "Update from email" button (placeholder — we'll wire AI later)
  - Delete button (red, with confirmation dialog)
- Next Action bar: shows next_action text + due date. Inline editable. "Suggest" button (placeholder for AI).
- Timeline: chronological list of activity_log entries for this company. Each shows icon + description + relative time.
- Tabs (use Radix Tabs or shadcn Tabs):
  - Comms (placeholder for now — we'll build the email composer in Phase 5)
  - Notes — list of notes with timestamps + add note form (textarea + submit)
  - Contacts — list with name/role/email/initials + add contact form
  - Interview Prep (placeholder)
  - Files (placeholder)

Make sure status changes log to activity_log. The timeline should update when notes are added, status changes, etc.
```

---

### Step 4.3 — All Jobs Table

**Prompt:**
```
Read CANDOR_SPEC.md section 6.4 (All Jobs). Build the All Jobs table at /dashboard/jobs/page.tsx.

- Table columns: Checkbox, Company (+ logo placeholder), Role, Industry, Location, Salary, Status (colored pill with dropdown), Next Action (truncated), Updated (relative time)
- Search bar above the table: filters by company name, role, or location
- Status filter: multi-select dropdown to show/hide specific statuses
- Column sorting: click headers to sort (default: updated descending)
- Bulk actions bar: appears when one or more checkboxes are selected. Actions: "Move to [status dropdown]", "Delete selected" (with confirmation showing count)
- Clicking a row navigates to /dashboard/board?company=[id]
- Select all checkbox in the header row
- Empty state if no companies: "No applications yet. Add your first one with ⌘K"
- Table should use the dark theme — surface background, border between rows, status pills matching STATUS_COLORS, hover state on rows
- Responsive: on smaller screens, hide less important columns (location, salary, updated)
```

---

### Step 4.4 — Analytics

**Prompt:**
```
Read CANDOR_SPEC.md section 6.5 (Analytics). Build the Analytics page at /dashboard/analytics/page.tsx.

Calculate all stats from the industries/companies data. No chart library needed — build visual charts with pure CSS/divs.

Sections:
1. Pipeline Funnel — horizontal bars for each status (draft → applied → interviewing → offer), with count and percentage. Bar widths proportional to count. Rejected shown separately below with message: "X rejected — that's normal, keep going."
2. Weekly Activity — applications submitted this week vs last week. Show as two large numbers side by side with an up/down arrow and color (green if more, amber if same, red if fewer)
3. Response Rate — % of applications that got any response (interviewing, offer, or rejected) vs no response. Show as a donut or progress bar.
4. Avg Time-to-Response — average days between applied_at and status_changed_at for companies that moved past "applied". Show as a single large number.
5. Top Industries — which industry groups have the highest interview/response rate. Simple ranked list.

Skip "Authenticity Score Trend" for now (we haven't built scoring yet — add a placeholder card that says "Unlocks when you start using the Cover Letter Studio").

Use surface cards with headers, generous spacing, the design system colors for all chart elements.
```

---

### Step 4.5 — My Story (Profile)

**Prompt:**
```
Read CANDOR_SPEC.md section 6.6 (My Story). Build the Profile page at /dashboard/profile/page.tsx.

Sections (each in a surface card):
1. Basic Info — name (text input), headline (text input), narrative (textarea — "Your professional story in your own words. The AI uses this to personalize everything it generates for you.")
2. Skills — tag input. Type a skill, press Enter to add as a pill. Click X on a pill to remove. Show existing skills as gold-accent-outlined pills.
3. Timeline — structured list of experiences. Each entry: role, company, start date, end date (or "Present"), highlights (textarea). Add/remove entries. Sorted by date descending.
4. Voice Samples — "Paste 3–5 snippets of your own writing (emails, cover letters, anything) so the AI can match your tone." Each sample is a textarea. Add/remove samples.
5. Resume Upload — drag-and-drop zone or file picker. Accepts PDF. Shows filename if uploaded. "Parse with AI" button (placeholder — we'll wire later). Status: "Not uploaded" / "Uploaded [date]" / "Parsed [date]".
6. Email Templates — saved structures for cover letter, follow-up, thank you. Each has a name and body textarea. Add/remove.

All changes auto-save on blur (debounced) with a subtle "Saved" indicator. Use the profile hook for read/write.
```

---

## Phase 5: AI Features

### Step 5.1 — AI Service Layer

**Prompt:**
```
Read CANDOR_SPEC.md section 7 (AI Integration). Create src/lib/ai.ts — the single AI service layer.

Set up the Gemini API client using the GEMINI_API_KEY env var. Create all the functions listed in the spec, but implement them one at a time. For now, implement:

1. generateEmail(jdText, profile, emailType, tone) — sends a prompt to Gemini that generates a cover letter SCAFFOLD with [placeholder brackets] where the user should add personal content. The prompt should explicitly say "Never generate a finished email. Always include [bracketed placeholders] for personal stories, specific examples, and genuine reasons." Returns the generated text.

2. refineEmail(draft, tone) — takes an existing draft and improves it. Adjusts tone if specified. Returns refined text.

3. generateSubjectLines(body, emailType) — returns an array of 3–5 subject line strings.

For the remaining functions (scoreAuthenticity, parseJobUrl, suggestStatusFromEmail, generateInterviewPrep, suggestNextAction, parseResume), create stub functions that return mock data with a console.log("TODO: implement [functionName]"). We'll implement them in subsequent steps.

All functions should:
- Be async
- Wrap API calls in try/catch
- Timeout after 30 seconds
- Return { success: true, data: ... } or { success: false, error: "message" }
- Log errors to console

Create a Next.js API route at src/app/api/ai/route.ts that accepts POST requests with { action: "generateEmail" | "refineEmail" | etc, params: {...} } and calls the appropriate function. This keeps the API key server-side.
```

---

### Step 5.2 — Email Composer (Comms Tab)

**Prompt:**
```
Read CANDOR_SPEC.md section 6.7 (Comms). Build the full email composer inside the Comms tab of the company detail panel.

Thread View (top section):
- Chronological list of all emails for this company (from the emails table)
- Each entry: direction icon (→ sent, ← received), subject (bold), body preview (truncated to 2 lines), date, tone tag if set
- Click to expand full body
- Empty state: "No emails yet. Start a conversation below."

Composer (bottom section):
- To field (pre-fill from contacts if available, otherwise editable)
- Subject field with a "✦ Suggest" button that calls generateSubjectLines and shows options as clickable pills
- Body: textarea with basic formatting (or just a tall textarea for now — rich text can come later)
- Email type selector: Cover Letter, Follow-up, Thank You, General (dropdown or segmented control)

AI Buttons:
- "✦ Generate" — calls generateEmail with the company's JD, user's profile, selected email type, and tone. Replaces body content with the scaffold. Shows loading shimmer while generating.
- "✦ Refine" — calls refineEmail with current body. Shows loading shimmer.
- Authenticity Score badge — placeholder for now, show "—" with tooltip "Coming soon"

Action Buttons:
- "Save Draft" — saves to emails table as direction: sent, but doesn't mark as sent_at
- "Copy" — copies body to clipboard, shows toast "Copied to clipboard"
- "Add to Thread" — saves as sent email with sent_at = now, adds to thread view
- "Add Received" — opens a mini form to paste a received email (subject + body), saves as direction: received

All actions should optimistically update the thread view.
```

---

### Step 5.3 — Authenticity Scoring

**Prompt:**
```
Read CANDOR_SPEC.md section 6.8 (Authenticity Scoring). Implement the scoreAuthenticity function in lib/ai.ts and wire it into the email composer.

Implement scoreAuthenticity(body, voiceSamples):
- Send a prompt to Gemini that analyzes the text for:
  - Generic AI-sounding phrases (list examples in the prompt: "I am writing to express", "leverage synergies", "results-driven", "I am passionate about", "dynamic environment", etc.)
  - Vague claims without specific evidence
  - Sentences that could apply to any company (not specific)
  - Tone mismatch with the voice samples (if provided)
- The prompt should return JSON: { score: number (0-100), flaggedPhrases: [{ text: "exact phrase", reason: "why it's flagged", suggestion: "what to write instead" }] }
- Parse the response and return it

Wire it into the email composer:
- The Authenticity Score badge now shows the real score, colored: red (<40), amber (40-70), green (>70)
- Below the composer body, show flagged phrases as a list: each shows the flagged text (highlighted), the reason, and the suggestion
- Score recalculates on blur of the body field (not on every keystroke — debounce)
- When the user edits and removes a flagged phrase, the score updates on next blur
- If no body text, show "—" for the score
- Loading state: shimmer on the badge while scoring
```

---

### Step 5.4 — Interview Prep

**Prompt:**
```
Read CANDOR_SPEC.md section 6.9 (Interview Prep). Implement the interview prep feature.

First, implement generateInterviewPrep(jdText, profile, roundNumber) in lib/ai.ts:
- Prompt Gemini to generate: 10–15 practice questions (categorized: behavioral, technical, situational, company-specific), talking points (STAR format based on profile), and company research notes
- Return as structured JSON

Then build the Interview Prep tab in the company detail panel:
- "Generate Prep" button — calls the AI function, stores result in interview_prep table
- If prep already exists, show it. "Regenerate" button to refresh.
- Sections:
  - Practice Questions: listed by category. Each question expandable to show suggested answer framework. Checkbox to mark as "practiced".
  - Talking Points: STAR-formatted experiences from the user's profile that match this role
  - Company Research: key facts, recent context, culture signals, questions to ask them
  - Your Notes: free-text textarea for personal prep notes (saves to research_notes field)
- Round selector (if company is in interviewing status): dropdown to select round number, regenerate prep for that specific round
- Loading state: skeleton cards while generating
```

---

### Step 5.5 — Update from Email

**Prompt:**
```
Read CANDOR_SPEC.md section 6.11 (Update from Email). Implement the full flow.

First, implement suggestStatusFromEmail(emailText, currentStatus, threadHistory) in lib/ai.ts:
- Prompt Gemini to read the pasted email in context and return JSON: { suggestedStatus: string, reason: string, summaryNote: string }

Then build the UI:
- "Update from email" button in the company detail header
- Opens a modal with a large textarea: "Paste the email you received"
- "Analyze" button — calls the AI function, shows loading
- Result view: "Move to [status pill]? Reason: [reason]" with Accept and Dismiss buttons
- Accept: updates company status (triggers micro-feedback toast), adds a note from the AI summary, adds the email to the thread as received, logs to activity_log, closes modal
- Dismiss: closes modal, no changes
- Error state: "Couldn't analyze this email. Try again." with retry
```

---

### Step 5.6 — Job URL Parsing

**Prompt:**
```
Implement parseJobUrl(url) in lib/ai.ts:
- Create an API route that fetches the URL content (server-side to avoid CORS)
- Extract the page text content
- Send it to Gemini with a prompt to extract: company name, role title, location, salary (if mentioned), and the full job description text
- Return as structured JSON

Wire it into Quick Add:
- When the user enters a URL in the Quick Add modal, show a "Parsing..." indicator
- On success, auto-fill the company name and role fields, and save location, salary, jd_text, and jd_url to the company record
- On failure, show "Couldn't parse this URL" but still let them add manually
```

---

### Step 5.7 — Resume Parsing & Next Action Suggestions

**Prompt:**
```
Implement the remaining AI functions:

1. parseResume(resumeText) in lib/ai.ts:
- Accepts text content from a PDF (we'll handle PDF-to-text extraction)
- Prompts Gemini to extract: name, skills, timeline (role, company, dates, highlights), education
- Returns structured JSON matching the profile schema

Wire into My Story:
- "Parse with AI" button on the resume upload section
- Extracts text from the uploaded PDF (use a library like pdf-parse)
- Calls parseResume, shows results as a preview
- "Apply to Profile" button fills in the profile fields with parsed data (doesn't overwrite existing data — merges)

2. suggestNextAction(company, activityLog) in lib/ai.ts:
- Based on current status, last activity, and time elapsed, suggests what to do next with a due date
- E.g., "Follow up with recruiter" due in 3 days if applied 7 days ago with no response

Wire into company detail:
- "✦ Suggest" button next to the Next Action bar
- Shows the suggestion inline, user can accept (saves) or dismiss
```

---

## Phase 6: Polish & Micro-feedback

### Step 6.1 — Micro-feedback System

**Prompt:**
```
Read CANDOR_SPEC.md section 8 (Micro-feedback). Build the complete micro-feedback system.

1. Status Change Toasts — when a company status changes, show a toast with the message from the spec:
   - Draft → Applied: "Application sent. You're in the game." + checkmark animation
   - → Interviewing: "Nice. They want to talk. You've got this." + brief confetti
   - → Offer: "Congratulations. All that work paid off." + gold glow + confetti
   - → Rejected: "Onward. Every no gets you closer to the right yes." + calm fade
   Use a toast component (build one or use shadcn's sonner/toast). The confetti should be small and tasteful — use a lightweight CSS confetti animation, not a heavy library.

2. Milestone Celebrations — check on data changes:
   - 10th application: "Double digits. You're putting yourself out there."
   - First interview: "Your first interview with Candor. Go show them who you are."
   - 100% authenticity score: "This is all you. No AI crutches."
   Show these as a special toast or a brief modal overlay.

3. Inactivity Nudges — surface these in the Today View focus list (they should already be there from the priority logic, but make sure the messaging matches the spec exactly).
```

---

### Step 6.2 — Keyboard Shortcuts

**Prompt:**
```
Read CANDOR_SPEC.md section 10 (Keyboard Shortcuts). Implement all keyboard shortcuts globally:

- Cmd/Ctrl+K: Quick Add modal (already done, verify it works)
- Escape: Close any open modal or slide-out panel
- 1/2/3/4/5: Switch between Today/Board/All Jobs/Analytics/My Story (only when no modal is open and no input is focused)
- Cmd/Ctrl+Enter: Submit the currently focused form or send email
- ↑/↓: Navigate between companies in the sidebar (highlight changes, Enter selects)
- Cmd/Ctrl+/: Show a keyboard shortcuts overlay (modal listing all shortcuts)

Use a global event listener. Make sure shortcuts don't fire when the user is typing in an input or textarea.
```

---

### Step 6.3 — Loading States & Error Handling

**Prompt:**
```
Review every page and component in the app. Add proper loading and error states everywhere:

- Page-level loading: skeleton screens (not spinners) that match the layout of the actual content. Use shimmer animation on surface-colored rectangles.
- API errors: inline error messages with retry buttons. Never show raw error messages to the user.
- Empty states: every list, table, and section should have a meaningful empty state with an icon and helpful text (not just blank space).
- AI loading: shimmer animation in the exact area where the AI result will appear (e.g., email body area shimmers while generating).
- Offline/network errors: subtle banner at the top "Connection lost. Changes will sync when you're back online."
- Form validation: inline error text below fields, red border on invalid inputs.
- Optimistic update failures: revert the UI change and show a toast "Something went wrong. Your change wasn't saved."
```

---

### Step 6.4 — Responsive Design

**Prompt:**
```
Make the entire app responsive:
- Desktop (>1024px): sidebar visible, full layout as designed
- Tablet (768-1024px): sidebar collapses to icons only, expands on hover or hamburger click. Tables hide less important columns.
- Mobile (<768px): sidebar becomes a bottom nav bar with icons for the 5 main sections. Quick Add is a floating action button. Company detail is a full-screen view (no split with sidebar). Tables scroll horizontally. Modals are full-screen.

Don't redesign anything — just make the existing design adapt gracefully. The app should be fully functional on mobile even if the experience is optimized for desktop.
```

---

## Phase 7: Final Integration & Deploy

### Step 7.1 — End-to-End Testing

**Prompt:**
```
Go through the entire app flow and fix any issues:

1. Sign up with email → lands on Today View → shows empty state
2. Add an industry ("Tech Companies" 🚀)
3. Quick Add a company ("Atlassian", "Product Manager", into Tech Companies)
4. Open it in Board view → see detail panel with draft status
5. Write a note, add a contact
6. Go to Comms → generate a cover letter → check authenticity score → save draft
7. Change status to Applied → see micro-feedback toast → check activity timeline
8. Go to All Jobs → see the company in the table → change status from the table
9. Go to Analytics → see stats update
10. Go to My Story → fill in profile → add voice samples
11. Check Today View → see relevant focus items

Fix any bugs, broken interactions, missing data syncs, or visual inconsistencies you find. Make sure the activity log captures all state changes.
```

---

### Step 7.2 — Performance & Cleanup

**Prompt:**
```
Review the codebase for performance and cleanliness:

1. Remove any console.logs that aren't error handling
2. Make sure all Supabase queries are efficient (no N+1 queries — use joins where possible)
3. Add proper TypeScript types everywhere (no 'any' types)
4. Make sure all components have proper key props in lists
5. Check that all useEffect hooks have proper dependency arrays
6. Verify RLS policies are correct (test with a second user account if possible)
7. Add loading="lazy" to any images
8. Make sure the AI service properly handles rate limiting and errors
9. Verify all forms handle double-submit (disable button while submitting)
10. Check accessibility: all interactive elements have labels, modals trap focus, color is not the only indicator for status
```

---

### Step 7.3 — Deploy to Vercel

**Prompt:**
```
Prepare the project for Vercel deployment:
1. Make sure all environment variables are documented in .env.example
2. Create a vercel.json if any special configuration is needed
3. Verify the build succeeds: run "npm run build" and fix any errors
4. Make sure there are no hardcoded localhost URLs — everything uses environment variables
5. Add a README.md with: project description, tech stack, setup instructions, environment variables needed
6. Create a .gitignore that excludes node_modules, .next, .env.local

After this, I'll connect the GitHub repo to Vercel and deploy.
```

---

## You're Done (For Now)

At this point you have a fully functional Candor with:
- Auth (email + Google)
- Dashboard with Today View, Board, All Jobs, Analytics, My Story
- Industry-based company organization
- Full email composer with AI generation, refinement, and authenticity scoring
- Interview prep with AI
- Update from email with AI status suggestions
- Job URL parsing
- Resume parsing
- Micro-feedback and celebrations
- Keyboard shortcuts
- Responsive design
- Deployed on Vercel

### What comes next (future phases):
- Gmail integration (auto-pull emails into thread)
- Browser extension for one-click job import
- Voice & tone learning (AI improves over time based on your edits)
- Freemium model + Stripe payments
- Custom domain
- Public launch

---

*Keep CANDOR_SPEC.md and this BUILD_ORDER.md in your project root. Reference them every session.*
