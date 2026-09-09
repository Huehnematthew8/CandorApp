# Why Candor exists

**Product context · 8 September 2026**  
Source: Matthew Huehne’s instructions and account of his job search, conversations with other people, and the job-application workflow in his Obsidian vault. This is a working product direction, not market research.

Starting and maintaining a job-search spreadsheet takes effort before it becomes useful. The work then spreads across job ads, contacts, conversations, documents and reminders. Candor brings those records together so someone can see where an opportunity stands and what they want to do next.

The principle is **authenticity over volume**: pursue worthwhile opportunities, understand the work, and express real experience accurately. Networking is useful when there is a relevant connection or question. Direct applications are equally valid. The app should support both without treating contact counts as proof of application quality.

Matthew’s thesis, informed by his experience and people he has spoken with, is that there may be room between résumé builders and mass-application tools for thoughtful application organisation. Demand, differentiation and willingness to pay remain unverified.

## Product decisions

- Start with a company and role or area of interest; add context as it becomes useful. Keep the next action visible and editable.
- Connect opportunities with people, conversations, follow-ups and tailored documents. A company to explore is different from a verified vacancy.
- Keep closed/unavailable, rejected and withdrawn distinct. A missing listing does not explain why it disappeared.
- Use the master résumé and source notes as evidence. Keep personal and team contributions clear, flag historical stories for review, preserve earlier wording, and retain exact submitted copies.
- Let AI support accurate expression and deliberate work. Do not invent achievements, imply hiring certainty, or reward generic application volume.
- Keep the current app local and recoverable. No automatic messages, applications or vault updates.

## Current implementation and boundaries

The canonical `app.html` supports role records, contacts and activity, explicit next actions, a master résumé, tailored variants, story provenance/review, submitted snapshots, archiving, local persistence and JSON backup/recovery. Australia is the primary search; international opportunities remain distinguishable. Seed records preserve known context and identify exploratory targets rather than claiming live vacancies.

Draft outlines and ad-text extraction are deterministic helpers for review. The app has no connected external AI, mailbox, automatic job search, automatic vault sync or submission service. Cloud accounts, collaboration, connected services and broader market validation are deferred. These should be added only when a concrete user need justifies their cost and complexity.

The next useful action is to open an actual opportunity, check its context, record the next action and continue the application. Maintain this document when the product direction changes; routine job-search updates belong in the app.
