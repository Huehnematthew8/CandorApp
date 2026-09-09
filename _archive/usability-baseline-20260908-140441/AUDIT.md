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

## Verification

**65 isolated checks pass:** 42 security checks and 23 workflow checks. Run:

```sh
node scripts/security-tests.cjs
node scripts/workflow-tests.cjs
```

These exercise canonical and original-backup acceptance, adversarial import shapes, unsafe links, HTML-bearing IDs/dates, save/reload, quota failure, cross-tab refusal, malformed-storage recovery, archive preservation, duplicate handling, explicit dates, draft-only activity, evidence history and immutable submitted text. The complete inline JavaScript also passes syntax checking.

Browser verification used a separate local test origin on port 8771, with synthetic role/contact records. The user preview on port 8770 contains no test records. Verified journeys: pasted ad to saved opportunity; full-ad retention; user-set next action; reload; contact creation and draft-only activity; master-to-tailored version; explicit submitted-copy recording; archive and restore; generated backup output; malformed import rejection with existing counts unchanged. Valid backup restoration, storage failure and cross-tab conflict were exercised in isolated tests, not by changing user browser storage.

Inspected desktop at 1280 × 900 and mobile at 390 × 844, including menus, role drawer, résumé layout and compact capture form. The role table scrolls horizontally on narrow screens; company buttons open details directly. Browser console showed no errors in the checked final journeys. Browser coverage is representative, not an exhaustive device/accessibility certification.

## Limits and next decisions

- This is a private local application, not a production service. Browser data is separate from the HTML, source archives and Obsidian vault. Use the same browser/profile and preview address; export backups before moving or clearing browser data.
- The app contains a dated local career snapshot, not a full live import of the master workbook. No automatic vault/workbook synchronisation exists. New career facts still need to reach the canonical vault deliberately.
- No external AI, mailbox, automatic job research, cloud collaboration, application submission or sending is connected. Draft outlines are deterministic. No credentials or paid services were enabled.
- Submitted snapshots preserve text. They do not upload or verify a previously submitted PDF. Résumé output is a text preview/copy workflow, not a finished PDF layout engine.
- Historical stories are preserved for review. Their review flags are not a claim that every old anecdote is wrong. Master sources and later firsthand corrections take priority.
- The product rationale is Matthew's qualitative observation and hypothesis, not verified market research or evidence that competing tools do not exist.

No user decision blocks the implemented local scope. Future work should start with actual use and observed friction rather than expanding the feature list.
