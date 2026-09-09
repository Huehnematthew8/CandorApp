# Candor — Complete Product Specification

> **Purpose:** This is the single source of truth for Candor. Paste this into every Claude Code session. Every decision should reference this spec.

---

## 1. Product Vision

**Candor** is a web-based job application platform that helps people apply authentically at scale. It combines application tracking, AI-assisted writing, and authenticity feedback into a single tool that reduces the friction of job searching while ensuring every application sounds like a real human wrote it.

**The Problem:** Between finding a job and landing it, everything is manual. People track applications in spreadsheets, write cover letters from scratch, lose track of follow-ups, and feel overwhelmed. Meanwhile, AI tools flood the market with generic applications that recruiters are learning to spot.

**The Insight:** The future belongs to tools that let people be genuinely themselves — just faster and more organized. Recruiters will reward authenticity as AI-generated content becomes the norm.

### Core Philosophy
- **AI handles logistics, you bring personality.** Every AI feature is a scaffold, not a finished product.
- **Reduce decision fatigue.** Tell people what to focus on today.
- **Learn and adapt.** The app gets smarter the more you use it.
- **Minimal friction.** If it takes more than two clicks, redesign it.
- **Clean, not slop.** Every UI element earns its place.
- **One way to do things.** Never duplicate views of the same data.

---

## 2. Target User

**Primary:** Recent graduates and early-career professionals (22–30) actively applying to multiple roles. Tech-comfortable, juggling 10–50+ applications, currently tracking in Google Sheets or not tracking at all.

**Initial users:** Matty + small group of friends for testing. Auth is built from the start. Product scales to public launch without architectural changes.

---

## 3. Tech Stack

### Architecture: Consolidated
No separate backend. One Next.js project handles everything.

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | Frontend + API routes + SSR in one project |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first + polished accessible components |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in auth, real-time, RLS |
| **Auth** | Supabase Auth | Email/password + Google OAuth, no custom tokens |
| **AI** | Google Gemini API (free tier) | Free, fast. Abstracted behind lib/ai.ts so provider is swappable |
| **Hosting** | Vercel | Zero-config Next.js deployment, free tier |
| **Drag & Drop** | @dnd-kit/core | Lightweight, performant |
| **Icons** | Lucide | Consistent stroke weight |

### AI Provider Strategy
Start with Gemini free tier. All AI calls go through `lib/ai.ts` — a single service layer that abstracts the provider. If quality isn't sufficient for writing tasks, migrate to Claude Sonnet for writing features while keeping Gemini for lighter tasks (JD parsing, status suggestions).

---

## 4. Design System

### Theme
Single dark theme. No light mode.

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #0C0C0E | Page background |
| `--surface` | #141418 | Cards, panels, sidebar |
| `--surface2` | #1C1C22 | Elevated elements, modals |
| `--surface3` | #24242C | Hover states, active elements |
| `--border` | rgba(255,255,255,0.06) | Subtle dividers |
| `--border2` | rgba(255,255,255,0.12) | Prominent borders |
| `--text` | #E8E8E4 | Primary text |
| `--text-muted` | #9B9A97 | Secondary text, labels |
| `--text-dim` | #5C5C58 | Disabled, placeholder |
| `--accent` | #C8A97E (gold) | Primary actions, brand |
| `--accent-glow` | rgba(200,169,126,0.15) | Glow behind accent elements |

### Status Colors
| Status | Dot | Pill BG (alpha) | Usage |
|--------|-----|----------------|-------|
| Draft | #5C5C58 | rgba(92,92,88,0.12) | Not yet submitted |
| Applied | #5B8DEF | rgba(91,141,239,0.12) | Submitted, awaiting |
| Interviewing | #D9853B | rgba(217,133,59,0.12) | Any interview stage |
| Offer | #4DA34D | rgba(77,163,77,0.12) | Received offer |
| Rejected | #C9515B | rgba(201,81,91,0.12) | Rejected any stage |

### Typography
- **Primary:** DM Sans (Google Fonts)
- **Brand/headings:** DM Serif Display for "Candor" wordmark and select headings
- **Scale:** 11px labels, 13px body, 14–16px subheadings, 24–32px titles
- **Weight:** 400 body, 500 labels, 600 buttons, 700 stats

### Motion
- 150ms ease-out transitions on interactive elements
- Cards: translateY(-2px) + shadow on hover
- Modals: fade-in at 250ms
- Slide-out panels: translateX at 250ms
- Optimistic updates — no loading spinners for common operations

### UI Patterns
- rounded-lg (8px) for cards, rounded-full for pills
- Status = colored dots (sidebar) + pills (detail views)
- Buttons: outline or filled accent; destructive = red/20 bg
- Inputs: transparent + border-bottom, surface2 bg
- Themed thin dark scrollbars
- Lucide icons, 18–20px default

---

## 5. Data Model (Supabase PostgreSQL)

RLS on all tables — users only access their own data.

### users (Supabase Auth managed)
id, email, name, avatar_url, created_at

### profiles
id, user_id, name, headline, narrative (text), skills (JSON[]), timeline (JSON[]), strengths (JSON[]), resume_url, resume_parsed_at, voice_samples (JSON — writing style examples for AI), created_at, updated_at

### industries
id, user_id, name, emoji, display_order, is_open (boolean), created_at, updated_at

### companies
id, industry_id, user_id, name, role, location, salary, logo_url, status (enum: draft | applied | interviewing | offer | rejected), applied_at, status_changed_at, jd_text, jd_url, interview_round (integer, nullable), next_action (text), next_action_due (timestamp), created_at, updated_at

### emails
id, company_id, user_id, direction (sent | received), email_type (cover_letter | follow_up | thank_you | response | other), subject, body, tone, to_address, from_address, authenticity_score (0–100), sent_at, created_at

### notes
id, company_id, user_id, content, created_at

### contacts
id, company_id, user_id, name, role, email, phone, initials

### interview_prep
id, company_id, user_id, questions (JSON[]), talking_points (JSON[]), research_notes (text), created_at, updated_at

### activity_log
id, company_id, user_id, action (text), metadata (JSON), created_at

### Status Simplification
Previous: draft, applied, screening, round1, round2, offer, rejected (7).
Now: **draft, applied, interviewing, offer, rejected** (5). Interview round stored as integer on the company record. Reduces cognitive overhead.

---

## 6. Screens & Features

### 6.1 Sidebar (Persistent)
- Brand: "Candor" (DM Serif Display) + "Authenticity-first" tagline
- Nav tabs: Today, Board, All Jobs, Analytics, My Story
- Industry groups: collapsible, emoji + name + count
  - Companies listed: status dot + name + role (truncated)
  - Click → opens detail in Board view
  - Right-click/⋯ menu: Edit, Move, Delete
- Search bar: filters by name, role, location
- Quick Add button (bottom) + Cmd/Ctrl+K trigger
- Footer: user avatar + name + settings

### 6.2 Today View (Default Landing — /dashboard)
**Purpose:** "What should I do right now?" — the soul of Candor.

**Layout:**
- Greeting: "Good [time], [Name]" + date
- Stats row: Total Applications, Active, Interviews, Response Rate
- Today's Focus: prioritized action list (max 5–7 items)
- Recent Activity: last 5 changes

**Focus Priority Logic:**
1. Overdue follow-ups (next_action_due in the past)
2. Due today
3. Upcoming interviews (interviewing + prep incomplete)
4. Pending offers needing response
5. Stale applications (7+ days, no activity)
6. Drafts ready to send (draft + cover letter written)
7. Encouragement if no applications this week

**Micro-feedback:** Action buttons per item. Dismiss removes for the day. All done → "You're all caught up. Nice work."

### 6.3 Board View (/dashboard/board)
**Purpose:** Main workspace. Browse industries/companies, manage individual applications.

**Layout:**
- Left: Sidebar
- Right: Company Detail Panel (full remaining width)
- No company selected → empty state

**Company Detail Panel:**
- Header: name, role, status pill (dropdown), interview round, date, delete, "Update from email"
- Next Action bar: editable, AI-suggestable, with due date
- Timeline: chronological activity feed
- Tabs: Comms, Notes, Contacts, Interview Prep, Files

### 6.4 All Jobs (/dashboard/jobs)
**Table columns:** Checkbox, Company+logo, Role, Industry, Location, Salary, Status (pill dropdown), Next Action, Updated
**Features:** Search, status filter, column sort, bulk actions (move status, delete), row click → detail

### 6.5 Analytics (/dashboard/analytics)
1. Pipeline Funnel (bar chart with conversion rates)
2. Weekly Activity (this week vs last)
3. Response Rate (responded vs ghosted)
4. Avg Time-to-Response
5. Authenticity Score Trend
6. Top Industries by response rate

### 6.6 My Story (/dashboard/profile)
- Name, headline, narrative
- Skills (tags), Timeline (structured), Strengths (AI-generated)
- Voice samples: 3–5 writing snippets for AI tone matching
- Resume upload + AI parsing
- Email templates (cover letter, follow-up, thank you structures)

### 6.7 Comms (Email Composer — within company detail)
**Thread:** Chronological emails, direction icon, subject, preview, date, tone, authenticity badge
**Composer:** To, Subject (+ AI suggestions), Body (rich text), email type selector

**AI Features:**
- **Generate:** Scaffold with [placeholder prompts]. Never "finished."
- **Refine:** Improve draft, adjust tone
- **Authenticity Score:** Real-time 0–100, inline phrase flagging
- **Subject Lines:** 3–5 options

**Actions:** Save Draft, Copy, Add to Thread (sent), Add Received, Save as Template

### 6.8 Authenticity Scoring (Core Differentiator)
1. **Analysis:** Compares against AI patterns, user's voice samples, claim specificity
2. **Score:** 0–100. Red (<40), Amber (40–70), Green (>70)
3. **Inline Feedback:** Highlighted phrases + tooltips with suggestions
4. **Live Updates:** Recalculates as you edit (debounced)

**Flags:** Generic openers, buzzword clusters, vague claims, non-specific sentences, tone mismatch with voice samples

### 6.9 Interview Prep (within company detail)
- Practice Questions (behavioral, technical, situational, company-specific)
- Talking Points (STAR format from profile)
- Company Research (facts, news, culture, questions to ask)
- Your Notes (free text)
- Round selector for round-specific prep
- Questions markable as "practiced"

### 6.10 Quick Add (Cmd/Ctrl+K)
- Fields: Company name OR URL, Role (optional), Industry (dropdown/create)
- URL → AI parses company, role, location, salary, JD
- Enter submits. New entry appears as Draft. Sidebar scrolls. Toast confirms.

### 6.11 Update from Email
- Trigger: button in company detail header
- Paste email → AI suggests status + reason + summary note
- User confirms → status updates, note added, email added to thread as received

---

## 7. AI Integration

### Architecture
Single service layer: `lib/ai.ts`. All AI calls abstracted. Provider configurable via env var.

### Functions
| Function | Purpose | Input |
|----------|---------|-------|
| `generateEmail()` | Scaffold with [placeholders] | JD, profile, type, tone |
| `refineEmail()` | Improve draft, adjust tone | draft, tone |
| `scoreAuthenticity()` | 0–100 + flagged phrases | body, voice samples |
| `generateSubjectLines()` | 3–5 options | body, type |
| `parseJobUrl()` | Extract company/role/JD from URL | URL |
| `suggestStatusFromEmail()` | Suggest status + reason | email, status, thread |
| `generateInterviewPrep()` | Questions, talking points, research | JD, profile, round |
| `suggestNextAction()` | Recommend next step + due date | company, activity log |
| `parseResume()` | Extract structured data | resume text/PDF |

### Error Handling
- All calls in try/catch, 30s timeout
- Failure → clear message + retry button
- Never block UI — loading states with skeleton/shimmer
- No API key → "Set up AI in Settings"

---

## 8. Micro-feedback & Emotional Intelligence

### Status Changes
| Transition | Message | Visual |
|-----------|---------|--------|
| Draft → Applied | "Application sent. You're in the game." | Checkmark animation |
| → Interviewing | "Nice. They want to talk. You've got this." | Brief confetti |
| → Offer | "Congratulations. All that work paid off." | Gold glow + confetti |
| → Rejected | "Onward. Every no gets you closer to the right yes." | Calm fade |

### Nudges
- No apps this week: "Quiet week? Even one keeps momentum."
- Draft 3+ days: "[Company] is still in draft. Ready to send?"
- No follow-up 7 days: "A follow-up could help."

### Celebrations
- 10th app: "Double digits."
- First interview: "Go show them who you are."
- 100% authenticity: "This is all you. That's what makes it powerful."

---

## 9. Auth
- Supabase Auth: email/password + Google OAuth
- All /dashboard/* routes protected via middleware
- RLS on all tables (user_id scoped)
- Landing page (/) is public with sign-up/login

---

## 10. Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+K | Quick Add |
| Escape | Close modal/panel |
| 1–5 | Switch tabs |
| Cmd/Ctrl+Enter | Submit form / send email |
| ↑/↓ | Navigate sidebar companies |
| Cmd/Ctrl+/ | Show shortcuts overlay |

---

## 11. Accept vs. Reject

**Accept:** Minimal, reuses patterns, AI as scaffold, one path per task, optimistic updates, dark theme CSS vars.

**Reject:** Duplicate views, light mode, "finished" AI content, visual clutter, breaking context as source of truth.

**Case-by-case:** Gmail sync (if optional), new AI actions (if one-click), new Company fields (if minimal UI use), browser extension (Phase 2).

---

## 12. Environment

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### Optional
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `ANTHROPIC_API_KEY`

### Run
```bash
npm install
cp .env.example .env.local  # fill in keys
npm run dev  # localhost:3000
```

---

## 13. Monetization (Future — Freemium)

| Free | Pro ($12/month) |
|------|----------------|
| 10 active apps | Unlimited |
| 3 AI drafts/month | Unlimited AI |
| Basic analytics | Full analytics + authenticity trends |
| Manual entry | URL import + browser extension |
| | Email integration |
| | Voice & tone learning |

---

*End of spec. Build Candor.*
