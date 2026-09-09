# Why Candor exists

**Product context · 8 September 2026**  
Source: Matthew Huehne’s instructions and account of his job search, conversations with other people, and the job-application workflow in his Obsidian vault. This is a working product direction, not market research.

Starting and maintaining a job-search spreadsheet takes effort before it becomes useful. The work then spreads across job ads, contacts, conversations, documents and reminders. Candor brings those records together so someone can see where an opportunity stands and what they want to do next.

The principle is **authenticity over volume**: pursue worthwhile opportunities, understand the work, and express real experience accurately. Networking is useful when there is a relevant connection or question. Direct applications are equally valid. The app should support both without treating contact counts as proof of application quality.

Matthew’s thesis, informed by his experience and people he has spoken with, is that there may be room between résumé builders and mass-application tools for thoughtful application organisation. Demand, differentiation and willingness to pay remain unverified.

## Working style

Matthew wants Candor to feel like a natural notes workspace, similar to the flexibility he values in Notion. In his experience, job applications involve incomplete information, changing plans and work that does not fit a tidy sequence. Keep the interface clean and lightweight, with inline editing, autosave and optional details that appear when useful. This is his qualitative model of the workflow, not a finding about every applicant.

A person should be able to write a thought, keep a rough checklist, record a conversation or return to a draft without first completing a process. Structure should help them find and use their work. Stage changes, contact records and activity logs can add useful context when the person chooses to maintain them.

## Product decisions

- Start with a company and role or area of interest; add notes and context as they become useful. Prefer inline editing and autosave, with optional detail controls.
- Keep a flexible notepad within each role. Free text and bullets stay in its notes. The structured role checklist and Today show the same task records, linked to the role: add, edit, complete, undo or reload from either view without duplicate copies. Existing Markdown checklist text remains untouched in notes; it is not silently migrated. Tasks linked to archived roles stay saved and return to Today when the role is restored.
- Preserve previously recorded next actions and dates in optional details, alongside the newer notepad and task workflow. Do not discard them or require people to rewrite their existing plans.
- Connect opportunities with people, conversations, follow-ups and tailored documents. A company to explore is different from a verified vacancy.
- Keep closed/unavailable, rejected and withdrawn distinct. A missing listing does not explain why it disappeared.
- Use the master résumé and source notes as evidence. Keep personal and team contributions clear, flag historical stories for review, preserve earlier wording, and retain exact submitted copies.
- Let AI support accurate expression and deliberate work. Do not invent achievements, imply hiring certainty, or reward generic application volume.
- Keep the current app local and recoverable. No automatic messages, applications or vault updates.

## Current implementation and boundaries

The canonical `app.html` supports a role notepad using each opportunity’s saved notes, inline contact and activity records, a shared autosaving role/Today checklist, and optional next-action/date details. It also retains a master résumé, tailored variants, story provenance/review, submitted snapshots, archiving, local persistence and JSON backup/recovery. Australia is the primary search; international opportunities remain distinguishable. Seed records preserve known context and identify exploratory targets rather than claiming live vacancies.

Draft outlines and ad-text extraction are deterministic helpers for review. The app has no connected external AI, mailbox, automatic job search, automatic vault sync or submission service. Cloud accounts, collaboration, connected services and broader market validation are deferred. These should be added only when a concrete user need justifies their cost and complexity.

Start from an actual opportunity or the Today checklist, capture what is useful, and continue the application. Maintain this document when the product direction changes; routine job-search updates belong in the app.

## Planned AI assistance and contact research

AI should support the same flexible workflow: understand an ad, identify missing context, compare requirements with sourced evidence, help tailor a draft, research relevant people when authorised, and suggest optional outreach or next steps. Use only the relevant inputs, distinguish sources from inference, and keep manual editing available. Existing ad extraction and draft outlines are deterministic helpers and must be labelled accurately.

The current contact-research control prepares a local brief. It requires company, job title, role location and full ad text, plus the user’s explicit check that responsibilities and relevant context are present. Changing those inputs invalidates that check. Only copying the research brief is gated; saving, manual contacts and direct applications stay available. No search or external AI runs.

A future public-source finder should attach source URLs, check dates, relevance and uncertainty to suggested people, distinguishing suggestions from verified hiring responsibility. Mutual connections require separately authorised LinkedIn access. Do not invent referrals, private emails or permission to contact. Evidence-based editing must retain source/master revisions, rejected-claim corrections, draft history and immutable submitted copies.

Provider, authentication, permitted data destinations, costs and retention still need a user decision before integration. The whole vault and private contact details are not default provider inputs. [AI-OPPORTUNITIES.md](AI-OPPORTUNITIES.md) records three first-applicant observations, candidate assistance, manual fallbacks and measures of useful progress for later prioritisation.
