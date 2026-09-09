# First-time applicant interaction review

8 September 2026. Reviewer perspective: someone overwhelmed by the search, starting with one job link and no evidence library. This is an agent-assisted usability review, not a study with recruited human participants.

## Method and starting state

Read README.md and PRODUCT-CONTEXT.md, then interacted with the frozen synthetic fixture at `http://127.0.0.1:8772/app.html` using CUA clicks, field entry, a drawer scroll, screenshots and accessibility observations. The requested in-app browser was unavailable; used a new dedicated Chrome tab, ID 1090188187. No viewport change, external link navigation, real 8770 workspace access, message send, submission or personal data entry occurred. Did not read other reviewers' findings.

Starting Today showed no roles, contacts, stories or résumé content, a Test Applicant header, and a 1-of-4 getting-started card. Screenshot viewport was approximately 1512 x 772. The one supplied URL was `https://example.com/jobs/analyst`.

## Actual tasks and observed outcomes

1. Clicked **Add a role**, pasted the URL, clicked **Fill from ad**, entered synthetic company **Example Software** and role **Business analyst**, then clicked **Add role**. This took 3 clicks and 3 text entries from Today. It succeeded and opened the drawer. Parsing announced `Filled: jdUrl`; it also populated **Full job ad, verbatim** with the URL and expanded the entire optional-detail section.
2. Read the role drawer and screenshot, scrolled down one page, entered **Read the job ad and note two requirements** in Next action, and pressed Tab. Later returned to Today through Menu then Today. The action appeared as the main **START HERE** card with **No date set**, so an optional date did not prevent useful guidance.
3. Clicked **Tailor one** inside the drawer. The dialog prefilled the opportunity and variant name, left Summary empty, and checked **Start from the master selection (recommended)**. Clicked Create variant. It succeeded with **Variant created - now trim it down**, despite zero available items. Clicked Master to look for where to add experience. Both master and variant screens showed EXPERIENCE and EDUCATION headings with no add controls or empty-state instruction. I could not establish an employment/education evidence base through the visible UI.
4. Used **+ Summary**, entered a modest synthetic graduate introduction, and saved. This succeeded. No source/provenance field appeared in that dialog. Master still showed zero items because the count evidently excludes summaries.
5. Navigated Menu → Stories, clicked **+ Story**, entered a synthetic handover example using source, title and four STAR fields, then saved. Seven field entries plus two clicks from Stories produced a readable card. I deliberately left **Checked against current master and source** unchecked because the master was empty. The new story was labelled **Historical story: review against current evidence before reuse**, although it had just been created with a dated source. The caution is useful; the historical claim is not.
6. Returned Today → Open Example Software and clicked **+ Person**. Entered **Alex Example** plus a note that identity/current role/hiring responsibility remained unverified and no message was sent. Saved successfully. Contact displayed **Peer in the role · Identified**, because the route default asserted peer status without my input. Zero logged activities remained correctly displayed.
7. Entered a reason for optional outreach and clicked **Start a draft outline**. The draft inserted that reason verbatim, included a visible background placeholder, and showed a verify-before-copying toast. No activity was marked sent. The outline ended by asking for fifteen minutes about the Business analyst job even though the opportunity remained an exploratory target.
8. Reloaded the tab. The next action and opportunity persisted, and Today correctly reported nothing sent. The getting-started card now showed 3 of 4 complete; it still foregrounded a weekly target as the outstanding setup step.

## Prioritised findings

| Severity | Visible evidence / friction | Simplest remedy |
|---|---|---|
| P1 | Empty Resume has EXPERIENCE and EDUCATION headings but no way to add entries. Clicking Master did not reveal an action. A fresh user cannot build the core evidence needed for tailoring. | Add clear Add experience and Add education actions with small forms and a brief empty-state prompt. |
| P1 | Tailor one created a variant linked to Example Software in its dialog, but returning to that opportunity showed **Resume variant: none yet**; the created variant was only an unselected dropdown option. | Link the newly created variant back to its originating opportunity automatically, or make the selection step explicit. |
| P2 | A bare URL became **Full job ad, verbatim**, and the drawer exposed a Full job advertisement disclosure containing it. It also expanded roughly 18 optional metadata controls when only one URL was parsed. | Store URL-only input solely as the URL; explain that fetching is unavailable and invite pasted ad text. Keep unrelated optional fields collapsed. |
| P2 | Next action is below context, people, draft/outreach and application documents. On the 772px-high screenshot it was offscreen; I scrolled a page to reach it while on Direct apply. | Put Next action immediately after role identity/status. Collapse optional outreach for direct applicants. |
| P2 | Empty résumé tailoring offers **Start from master selection (recommended)** with no master items, then says **now trim it down** after creating an empty variant. | Give a short branch to add evidence first, or clearly allow an empty draft and explain how to populate it. Avoid implying existing content. |
| P2 | Adding a name alone defaults the contact to **Peer in the role**. My note explicitly said their current role was unverified, but the card asserted peer status. | Default route to Unknown / to confirm. Keep connection type separate from verified employment/title. |
| P2 | A brand-new, unchecked story is called **Historical story**, making a legitimate current source look stale. | Say **Needs evidence review** for unchecked stories; reserve historical wording for migrated records. |
| P2 | Getting started makes weekly targets one of four apparent requirements and describes the first move as **Warm route: find one person. Direct route: submit it.** A new direct applicant has not yet reviewed requirements or evidence. | Make target-setting optional; use a first-next-action step instead of directing an immediate submission. |
| P3 | Variant and Master counts stay at zero after a summary exists; footer uses **3 change since last exports**. | Label the count as selected bullets/items accurately and correct singular/plural copy. |

## What worked

The minimal company/role form was approachable before parsing expanded it. A role opened directly after save. The next-action card worked without a date and survived reload. Source and personal-contribution guidance in Stories was clear. Unverified availability remained explicit. Adding a contact and drafting did not invent sent activity. The app stayed local, without an account or external AI step.

## Coverage limits

Actually used Today, New role, parsed URL capture, role drawer, Next action, first tailored variant, Master, summary creation, Stories creation, contact creation and draft outline, plus reload. Did not test real ad fetching, external links, clipboard transmission, submitted-record flow, editing an existing career history entry (none existed), backups/import/recovery, mobile breakpoints, extensive keyboard navigation, or Settings in this review. No claims about those journeys follow from this pass.

## Implemented first-use fixes and hands-on retest

Assigned scope implemented in canonical app.html: optional Next action appears beside the minimal required opportunity fields; edits preserve an existing action if that field is absent. Bare URL parsing only fills the link and does not overwrite a previously captured full ad. Both URL and full-text parsing leave optional detail controls collapsed, with accurate feedback. Full ad text keeps original whitespace at save. Unchecked stories now say Needs evidence review, and the footer pluralises changes correctly.

Five isolated regressions in scripts/first-use-tests.cjs pass: URL-only capture, exact full-text preservation including subsequent URL parsing, minimal next action and reload, edit-without-action preservation, and neutral story review wording.

Refreshed only the working first.html fixture with current code, preserving its synthetic SEED and browser storage namespace. Retested through CUA in a fresh dedicated Chrome tab at port 8772; earlier synthetic records were retained. Created URL Capture Test / Analyst from a new URL, recorded its next action in the minimal form, and saved. The drawer showed the link and action but no false Full job advertisement section. Created Full Text Test from a five-line synthetic ad; suggested company and role were correct, details stayed collapsed, and opening the saved Full job advertisement displayed the entire wording and blank line. Returned to the existing newly sourced story and verified Needs evidence review, then opened its edit form and cancelled without changing it. Footer showed 1 change and then 2 changes since last export.

Layout check at the unchanged 1512 x 772 viewport: the minimal role form, parsing message, Next action and save/cancel controls all fit without scrolling, with visible focus and no overlap. Story form is longer than the viewport; one downward scroll reached all lower fields and Save/Cancel without clipping or obstruction. Its evidence-review checkbox is visibly oversized and centred on its own line above the label (roughly 38px square), wasting space. This is a remaining shared-CSS issue reported to the main agent, not edited in this ownership scope. Mobile layout was left to the main reviewer.

## Local contact-research preparation addition

Implemented the explicitly requested local preparation control, inserted below People by the drawer owner. It lists missing company/title/location/full ad, requires an explicit responsibilities/context check, and gates only Copy research brief. The current four-field context is saved alongside a boolean; edits invalidate prior confirmation. A URL-only legacy ad does not satisfy the full-description check. No external research service is connected. PRODUCT-CONTEXT.md records the proposed coherent AI workflow, public-person research versus separately authorised LinkedIn mutuals, provenance/privacy boundaries, pending provider/auth/cost decisions and three first-user AI opportunities.

Actual CUA check on isolated port 8772: opened Example Software, expanded Prepare contact research and saw missing Role location and Full job description, with checkbox and Copy research brief disabled. Used Edit role details to enter a synthetic Sydney location and responsibilities/context ad. Reopened the control: fields were present but Copy stayed disabled until I explicitly checked the ad confirmation. Clicking Copy then displayed Research brief copied. No search was run. Changed the role location to Melbourne through Details; reopening preparation showed the checkbox unchecked and copying disabled. Manual contact controls and role saving remained available throughout. Only synthetic local data was used.

The expanded first-use suite now has nine passing tests, including confirmation gating, invalidation, boolean validation and clipboard-failure fallback without a success claim. The workflow suite remains 23/23 passing. Clipboard denial was simulated only in isolated unit tests; the actual browser copy succeeded. No live people search, provider request or LinkedIn access was attempted.
