# Candor audit and implementation

Completed 8 September 2026. Canonical app: `app.html`. Start with `README.md`; product rationale and ongoing decisions live in `PRODUCT-CONTEXT.md`.

## Source and scope

The desktop project was initially empty. Three older implementations were found under `Desktop/Code`: `Repositories/CandorApp`, `CandorApp` and `candor_final`. They have different structures and no proven common git lineage. The later Next.js candidate contained extensive uncommitted work. Full working source copies, excluding credentials and generated caches, were archived with SHA-256 checksums before consolidation.

Matthew then supplied `Downloads/app.html` and explicitly selected it for this work. It is the standalone Job Search HQ prototype with role tracking, contacts, a master résumé, tailored variants and a story bank. This became the canonical app. The exact uploaded original remains at `_archive/user-attachment-20260908/app.html`, SHA-256 `8c9dccfae610918b2454a8f17c63b23bbf7c8825011f18ea3960395129b5e1a9`. The Downloads original and other source trees were not changed. The unrelated public portfolio was not edited.

Preliminary Next.js changes are retained at `_archive/next-candidate-with-preliminary-fixes/`. That alternate is incomplete and is not the app to run. Independent working findings remain in `_archive/audit-working-notes/`; one-off implementation patch scripts are historical records, not installation steps.

Three independent agents reviewed workflow fit, usability/accessibility, and security/data integrity. Findings were checked against the uploaded code and current Career Context, hub, master résumé and relevant role notes. Main work reconciled the findings, implemented the changes and tested browser journeys.

## Findings and changes

| Before | Implemented behaviour |
|---|---|
| State reset to the embedded snapshot on every reload. | Browser storage persists changes under a new namespace. Save failures remain visible and pending data can be exported. Another tab cannot silently overwrite a newer saved state. |
| Import checked only two top-level arrays and immediately replaced the workspace. | Versioned, bounded validation covers nested résumé/history data, duplicate IDs and unsafe object shapes. Previous saves and malformed original storage remain recoverable. |
| Role deletion removed contacts; undo was temporary. | Role archiving retains linked contacts and documents. Archived records have a visible Restore action. |
| Stage changes guessed an application date; no closed-listing outcome existed. | Dates are explicit. Found, researching, ready, closed/unavailable, rejected and withdrawn remain distinct. Listing availability and exploratory targets have separate fields. |
| Advice prescribed outreach and sometimes delaying applications, backed by unsupported tactical claims. | User-set next actions take precedence. Direct applications and optional contact exploration both work. Unsupported conversion promises, automatic waiting advice and the shared contact limit were removed. |
| Captured ad text could be discarded; opportunity context was thin. | Full ad text, source, availability check date, employer/role description, potential contribution and employer AI rules are retained. Local parsing is labelled as a heuristic. |
| Entry required navigating a long form. | Company and role/area of interest are the two required fields. Other details are collapsed for new entries. Duplicate opportunities and blank/duplicate contacts are rejected. |
| Any contact activity could imply sent outreach. | Activity distinguishes drafts/notes, sent messages, received replies and conversations. Notes do not update the last-contact date or mark outreach sent. |
| Draft generation asserted a fixed candidate background. | An editable outline uses placeholders and recorded context. No connected AI or message sending is represented. |
| Tailored résumés shared a live master, so historical output could drift. | Master and draft edits retain earlier versions. Tailored bullet wording can differ from master wording; changed master evidence flags drafts for review. Explicit submitted copies preserve exact text and remain read-only through the app. |
| Old seed material described Matthew as an analyst, left current work as placeholders and kept SEEK active. | The local master is refreshed from the current vault with provenance. SEEK is rejected; Google is closed/unavailable and not submitted. Draftable, Airwallex and Zoom are exploratory records. Older stories remain marked for source review before reuse. |
| Imported IDs, links and dates could inject HTML; unsafe link schemes were accepted. | Data-derived HTML is escaped and links allow only safe HTTP(S) URLs. Import validation rejects malformed nested evidence. |
| Hidden menus remained focusable, dialogs lacked focus control, select arrow keys were intercepted and mobile résumé content overflowed. | Named controls, dialog semantics, focus trapping/restoration, native select keys, reduced motion, compact mobile forms and direct mobile role-opening controls. Autosave no longer destroys the focused field. |

## Full-app usability follow-up

Matthew requested hands-on simulated-user reviews, followed by implementation, across the whole app. Three reviewers independently used separate synthetic browser workspaces, then retested their assigned changes. These are agent-assisted simulations, not research with recruited users or evidence of market demand.

- **First applicant:** empty workspace, first role/link, next step, first résumé and story, uncertain contact and draft. Report: `_archive/usability-pass-first.md`.
- **Busy employed applicant:** three roles, a short available work period, contact context, sent/reply events, follow-up, tasks and weekly planning. Report: `_archive/usability-pass-busy.md`.
- **Active applicant:** eighteen roles, filtering/status/archive, résumé intake/tailoring/submitted copy, Stories and backups. Report: `_archive/usability-pass-active.md`.

The independent reviews are complete. Implementation and targeted retests followed; later retests are not represented as further independent research. The pre-change app and docs remain in `_archive/usability-baseline-20260908-140441/`.

| Observed friction or explicit user request | Final behaviour |
|---|---|
| Today had several competing starting points, incomplete setup and weekly targets before the actual action. | Today opens first. One action leads; other actions and weekly activity are collapsed. The simple to-do list is prominent. Targets are optional. Future reminders remain scheduled rather than appearing due now. |
| Routine tasks required opening and saving a dialog. | Type directly in the checklist. Text saves during typing; Enter starts another row. Edit, complete, reopen and remove/Undo in place. Dates and links are optional inline details. |
| Each role felt like structured admin rather than a place to work. | An autosaving notepad leads the opened role. Free text and bullets remain notes. The structured checklist below it shares task records with Today. Existing next actions and dates remain under an optional disclosure. |
| User wanted an inline People mini-table rather than rounded cards and add-person dialogs. | Compact square contact rows use the existing table styling. Add/edit contacts and optionally log activity inside the table, with inline validation, save/cancel and focus handling. No additional modal is required. |
| Sent/reply logs could leave the person marked Identified; incoming messages inflated outbound counts. | Activity suggests the matching progress state without moving advanced records backwards. Weekly people contacted counts distinct recipients of explicitly recorded sent events. Notes and incoming replies do not count as outbound activity. |
| Starting a draft could replace the user's wording. | Existing draft text is kept. An outline is only inserted into an empty draft. Outreach remains optional and collapsed by default. |
| URL-only capture claimed to contain the full advertisement and expanded unrelated fields. | A URL stays a link; the helper does not fetch it or call it an ad. Full pasted text is preserved separately. Optional details stay collapsed for a bare link. |
| New users could not add experience/education to an empty résumé. | Add experience and education paths, first-summary selection and useful empty-state guidance now exist. Entered bullet sources are retained. |
| Newly tailored versions were not selected back on the role. | Creating/linking a variant selects it on that role unless doing so would replace its submitted-copy link. Existing submitted text stays immutable. |
| Résumé Highlight theme wrapped awkwardly and confused highlight with inclusion. | Separate wrapping rows explain highlighting versus included items, expose pressed states and include accurate summary/skill counts. Mobile version navigation is compact and horizontal. |
| User reported header/search overlap and unwanted tagline. | The tagline is removed. Search has room at phone widths; narrow-header spacing, footer wrapping and checkbox sizing are corrected. Stories filters are collapsed, and Settings leads with backup access rather than target setup. |
| Refresh replaced a selected light theme with system dark mode. | Fresh workspaces default to light. Deliberate light/dark choice persists separately from career data; a preference-save failure is reported. |
| Archived closed/rejected records could hide Restore. | Archive state takes precedence when rendering the recovery action. Linked tasks disappear from Today while their role is archived, remain preserved in the role, and return after restore. |
| User proposed AI contact finding from the full job description. | Local readiness checks identify missing role context and require explicit review of the ad before copying a research brief. Editing the context invalidates that review. This does not run AI/search or claim hiring ownership/mutual connections. |

**Shared checklist semantics:** one `state.tasks` item, stable ID and application link, displayed in the role and Today. Edits and completion affect that same item; there is no duplicated task copy to reconcile. Notes are not automatically converted to tasks. Existing literal Markdown checklist text remains untouched in the notepad; new shared items use the structured checklist rows. Archived-role tasks remain stored. Detailed contact activity is optional and nothing records a send merely because text was drafted.

**Observed interaction changes:** the original first-role journey took three clicks and three text entries from Today, followed by a page scroll to set a next action. Capture now keeps a bare link's unrelated fields collapsed; the optional next-action field can be entered during capture, and the final role notepad opens near the top. Basic Today task creation changed from opening a dialog and saving it to typing in a row with no save click; Enter is for the next row, not persistence. Contact creation still has an explicit save for validation, but stays in its table. No timing uplift or retention improvement has been measured.

## Verification and coverage

**112 isolated checks pass** across security (42), workflow (23), first use/research readiness (9), résumé usability (9), appearance (5), contacts/notepad (10), Today (8) and shared tasks (6). Run each `scripts/*tests.cjs` file with Node. These cover the original and current backup schemas, invalid data/links, save/reload, quota failure, cross-tab refusal, recovery, archives, exact submitted text, evidence history, contact validation, shared task identity, draft preservation and preference persistence. Some small rendering/unit checks simulate storage; the workflow suite exercises the actual storage functions.

| Area | Actually interacted with in the browser | Limits |
|---|---|---|
| Today | Empty and populated starts; action/reminder navigation; optional targets/help; direct task entry, rapid edit, immediate reload, Enter focus, completion/reopen, removal/Undo, optional dates/links | No recruited-user study; large backlog usability remains to be validated in ordinary use. |
| Roles | Link and full-ad capture, required fields, filtering/search, status changes, full ad, archive/restore, new notepad and shared checklist | No live job fetch. Main table intentionally scrolls horizontally on a phone. |
| People/outreach | Inline blank/duplicate validation, uncertain contact, edit, notes/draft, sent/reply status, follow-up, draft preservation, local research readiness/copy/reset after context change | No external messages, live search, LinkedIn access or inferred referrals. |
| Master/variants | Create experience/education/summary/bullet/achievement/theme; highlight/inclusion; create and link version; preview/copy; record submitted text; master changes leave submitted text intact | Text output only; no PDF rendering/submission verification. A qualification needs an included bullet to appear in the current text preview, labelled in the UI. |
| Stories | Create, edit/review source, filter, copy; corrected review label and phone form/checkbox | Imported historical anecdotes still require factual review. |
| Settings/backups | Navigate/read settings, weekly edit, copy/export, invalid backup/CSV rejection, appearance toggle/reload | Previous-save browser rollback was not executed: automatic approval review rejected it because the fixture contained non-trivial records that could be replaced. The isolated workflow tests cover valid restore and malformed-storage recovery. No user workspace was rolled back. |
| Layout/accessibility | Screenshots of desktop reviewer journeys; root responsive frame checks at 320, 390, 768, 1024 and 1440px; header/search, Today, contact table/editor, role notepad/checklist, résumé/highlights, story cards/form, settings; keyboard navigation/entry | Widths were sampled across relevant screens, not every screen-state-width combination. Frames verify responsive rendering, not mobile Safari/browser chrome. No exhaustive screen-reader certification. |

Scenario tests used isolated origins 8772–8774. Responsive checks used a local frame and separate test storage at 8777, because the browser viewport override did not consistently affect the targeted tab. The user workspace at 8770 received no synthetic test contacts or tasks. Browser clipboard-style fill was unreliable inside frames; keyboard input was used and checked. No JavaScript errors appeared in the final checked responsive journey. The visual pass caught a clipped mobile résumé navigation row introduced during compaction; its flex direction was corrected and rechecked.

## AI priorities

The ranked, source-grounded next-step plan is in `AI-OPPORTUNITIES.md`: reviewed job-description intake; evidence-grounded résumé/variant help; selected conversation-to-context/draft support; and source-cited contact research. The manual workflows, status transitions, persistence and spreadsheet mapping should remain deterministic. Useful repeat use means returning to reliable saved context and making worthwhile progress, not time spent or notification volume. Provider, authentication, spending, data selection/retention and any LinkedIn access must be decided before connecting those services.

## Limits and next decisions

- This is a private local application, not a production service. Browser data is separate from the HTML, source archives and Obsidian vault. Use the same browser/profile and preview address; export backups before moving or clearing browser data.
- The app contains a dated local career snapshot, not a full live import of the master workbook. No automatic vault/workbook synchronisation exists. New career facts still need to reach the canonical vault deliberately.
- No external AI, mailbox, automatic job research, cloud collaboration, application submission or sending is connected. Draft outlines are deterministic. No credentials or paid services were enabled.
- Submitted snapshots preserve text. They do not upload or verify a previously submitted PDF. Résumé output is a text preview/copy workflow, not a finished PDF layout engine.
- Historical stories are preserved for review. Their review flags are not a claim that every old anecdote is wrong. Master sources and later firsthand corrections take priority.
- The product rationale is Matthew's qualitative observation and hypothesis, not verified market research or evidence that competing tools do not exist.

No user decision blocks the implemented local scope. Connected AI remains a separate, unimplemented decision. Future work should start with actual use and observed friction rather than expanding the feature list.
