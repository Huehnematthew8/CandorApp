# Candor workflow audit

Read-only review of current canonical vault notes, 8 September 2026. No application source was available to this reviewer, so these are product requirements and acceptance criteria, not claims that an implementation passes. No vault files were changed.

## Source precedence and product shape

Sources are under `/Users/matthewhuehne/Desktop/Obsidian Vault/Matty's Vault/Job Applications/`: `Career Context.md`, `Job Applications.md`, `Templates/Role.md`, `Templates/STAR Story.md`, `Templates/Cover Letter.md`, and current primary notes for Google, SEEK, Airwallex Career Opportunities, Draftable and Zoom.

Candor should support a small set of deliberate applications and relationship-led exploration. The useful loop is capture a real opportunity, understand the role, match evidence, prepare appropriate documents, review, then record an authorised action. Outreach is optional. A contact or prepared CV is not an application. No scoring system or application-volume target is needed.

The vault workbook remains the shared master tracker, with role frontmatter owning synced rows. A standalone Candor build must state whether it is a separate local copy; it must not imply live vault/workbook synchronisation. A new app should offer controlled import/export or leave integration explicit, rather than silently create another authoritative tracker.

Latest Career Context says Matthew selected both Airwallex commercial/SDR and product/analyst networking tracks. The hub's older instruction not to treat SDR as selected is superseded by the specific dated update and current Airwallex note. SDR remains a distinct career path.

## Lean priorities

| Priority | Required behaviour | Source and reason |
|---|---|---|
| P0 | Separate availability, application stage, outcome and submission record. Preserve unknown dates. | Career Context Maintenance; Google and SEEK notes. Google closed because listing unavailable, never submitted, no rejection. SEEK submitted 3 August, rejected as reported 8 September, actual rejection date unknown. |
| P0 | Distinguish exploratory company target, networking introduction and verified vacancy. Allow missing role URL/location and explain unknowns. | Draftable, Zoom and Airwallex notes. Employer office presence does not verify role location. |
| P0 | Preserve submitted document snapshots and action history. Archive before document replacement; never silently rewrite sent materials. | Career Context Version history and new-information order; SEEK submitted version retains historical Analyst title. |
| P0 | Contact record includes source/uncertainty, relationship, outreach stage, draft and next step. Marking sent is an explicit user action; prepared draft never increments sent count. | Role template; Draftable/Zoom/Google notes. Warm connection, current employment, hiring authority, referral and sent status are separate claims. |
| P1 | Present opportunity, status, contacts and next action first, then plain-English employer/role context and possible contribution. Keep source/found/applied dates secondary. | Career Context Tracker layout and sorting. Potential contribution is an inference, not a verified hiring assessment. |
| P1 | Default active Australia-first view with terminal records last; preserve International and location-unconfirmed distinctions. | Career Context Tracker layout. Active sort: known Australia, stage, contact presence, priority, alphabetical. Do not classify by headquarters. |
| P1 | Capture ad text, source, capture/check date and whether verbatim or extract; save requirements, supporting evidence and gaps. | Role template; Google and SEEK notes explicitly label historical extracts, avoiding false full-ad claims. |
| P1 | Link tailored drafts to master evidence and source notes. Track personal contribution, team context, uncertainty and prohibited/withdrawn claims. | Career Context evidence limits; STAR template. Recalled numbers, capacity, proposals and forecast outcomes must not become measured achievements. |
| P1 | Show application-specific preparation restrictions alongside documents. | Airwallex main SDR form restricts AI for applications/interviews; networking materials are not an approved submission. Keep policy source/date and avoid universal assumptions. |
| P2 | Keep optional interview stories and reviewed reusable drafts close to the role. Avoid compulsory repeated audits or pseudo-precise fit scores. | Job Applications traps: process growth prevented applications; stop when substantive defects are resolved. |

## Representative acceptance journeys

1. Add an exploratory Draftable target with blank URL/location and user-reported friend Abby Caller. Save/reload retains uncertainty, no verified vacancy, no referral and zero messages sent. Add a next action without forcing a submission deadline.
2. Add a confirmed Australian vacancy, official link, full ad and check date. Map one requirement to sourced evidence and one genuine gap. Duplicate the same requisition/link and receive a recoverable duplicate warning rather than duplicate application counts. A second distinct role at the same employer remains allowed.
3. Close Google with reason listing/application unavailable. Submitted date stays blank; rejection count stays unchanged. Retained CV and unsent contact enquiry remain accessible. Record SEEK separately as closed/rejected with application date 2026-08-03, outcome reported 2026-09-08 and unknown actual outcome date.
4. Prepare a networking draft for an uncertain contact. Saving, copying or exporting it must not mark sent or imply attachment/referral. Explicitly record a real send later with date/channel and exact sent copy. Editing the next draft must not alter the historical send.
5. Add new first-hand evidence with date/source and personal/team boundary. Identify affected active drafts for review, keep a recoverable prior version, and leave submitted snapshots unchanged. If no propagation integration exists, expose this as a manual review task instead of claiming synchronisation.
6. Filter active Australian opportunities; preserve unconfirmed locations visibly, place explicitly international entries in a separate view and keep closed items retrievable. Opening a contact lead alone never advances application stage.
7. Export all roles, contacts, evidence links, document versions and history; reload; import a valid export without losing data. Reject malformed imports before mutation, offer a backup before replacement and never reset to samples on parse/storage failure.
8. On keyboard and narrow screens, create/edit/save a role, record a next action, inspect history and export. Field labels, focus return, visible validation and status text must work without colour or hover alone.

## Integrity risks to resolve against the recovered app

- Imported older role prose contains historical assertions and stale checklists. Prefer current frontmatter and latest dated clarification; do not automatically interpret every unchecked task as current work. Google's older Next checklist still refers to application preparation despite closure.
- Never seed private client material, full career evidence or outreach drafts into public code or external AI prompts. Local data needs clear storage/export boundaries.
- A single status dropdown cannot truthfully encode availability, application progress and outcome. At minimum preserve distinct fields even if the list view shows a compact combined label.
- Local browser storage is not a backup. Detect write failures and expose portable recovery without overwriting existing browser data or unknown schemas.
- No fake AI generation, claims of guaranteed interviews, invented impact metrics, inferred hiring manager or implied contact permission. AI support should be grounded editing or an explicit user-controlled preparation step.

## Scope decision

If the original Candor app cannot be recovered, preserve that finding and ask for its location or attachment. These requirements are sufficient to assess a recovered version but do not justify silently replacing the missing prototype with a new application or with `portfolio.html`, which is a different public portfolio.
