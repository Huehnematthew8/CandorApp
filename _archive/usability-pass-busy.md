# Hands-on pass: busy employed applicant

8 September 2026. Persona: an employed career changer who has a few minutes to organise a worthwhile opportunity, with optional relationship-led outreach. This pass used actual browser clicks, typing, selections and screenshots, not source inspection. No other agents' findings were read.

## Environment and starting point

Isolated `http://127.0.0.1:8773/app.html` only. CUA reported the requested in-app browser unavailable, so I created a separate Chrome test tab/session. I did not change viewport settings or access the real app at port 8770. Screenshots were inspected at the existing 1512 × 828 viewport.

Initial records: Cedar Systems / Business Analyst (Researching, next action “Check application instructions”), Harbour Tools / Implementation Consultant (Applied), Example Payments / Product Operations (Applied). Three synthetic roles, no contacts/tasks/stories/variants. No external messages were sent or links opened.

## Observed journey

1. Opened Menu → Today. Saw a comeback banner, a large Getting Started card at 3/4, Start Here for Cedar, This Week, Next 7 Days and Tasks. Start Here gave a useful concrete starting point, although two other cards preceded it.
2. Opened Cedar from Start Here. Entered a next action asking Jamie about BA/implementation handover, due 10 September. Added Jamie Example with uncertain team membership, mutual-connection route and explicit notes saying contact details were unverified.
3. Wrote a reason and a 48-word outreach draft. Navigated to Details, changed Researching to Ready and saved. The draft remained; the drawer still showed zero logged activities and the contact remained Identified. Drafting alone did not record a send.
4. Logged one synthetic “Message actually sent”, Email, 8 September, follow-up 15 September. Inspected Context and activity and saw the exact saved sent record.
5. Logged one synthetic “Reply received”, Email, same date, revised follow-up 11 September. The contact still displayed Identified. I subsequently edited it to Replied manually.
6. Changed the role next action to replying with two proposed chat times, due 9 September. Today showed it under Start Here and Next 7 Days, plus the contact follow-up for 11 September. Clicking the contact follow-up reopened the generic role drawer.
7. Read This Week and After That help. Set optional weekly targets to two people contacted and one application. Screenshot showed the messages ring green at **2 of 2**, despite only one person and one outbound message (plus their incoming reply). Settings called this target “People contacted per week”.
8. Created a general task “Review one source story before the chat” due tomorrow. It appeared in Start Here, Next 7 Days and Tasks; the role action moved to After That. Completed the task, expanded Done and unchecked it to restore it successfully.
9. Opened Settings through the brand menu. Read weekly targets, local backup explanation and product rationale. Reloaded the app; it returned to Roles. Cedar’s Ready status, contact, next action/date and draft survived. Reopened the drawer to verify.
10. Clicked “Start a draft outline” with the existing 48-word draft present. It immediately replaced my text with a 53-word template, without confirmation or a visible Undo. I restored the known synthetic draft manually.

## Findings to act on

### P1 — Starting an outline replaces existing work immediately

The final step replaced a completed personal message with placeholders. The only feedback was “Draft outline ready…”; no visible undo or previous-draft control appeared. A busy user can lose their wording through an innocent helper button.

**Small remedy:** show the proposed outline separately, or offer explicit replace/keep actions while preserving the previous draft. Hide or disable the initial-outline action once meaningful text exists if that is the leaner implementation.

### P2 — Logged event and contact status contradict each other

Both Message actually sent and Reply received were saved while the contact stayed Identified. Record type and New status appear as separate controls in the same form, requiring duplicate classification. I had to reopen Edit person to correct the status.

**Small remedy:** changing the record type should suggest the matching status, with an explicit override. Avoid silently moving a more advanced contact backwards.

### P2 — Weekly target reaches “2 people” from one send and one reply

After the two logs, screenshot displayed **2 of 2 messages** in a green ring. Settings and target form described the target as **people contacted**. The nearby “Actions you took, never outcomes” copy conflicts with counting the incoming reply.

**Small remedy:** choose one definition and use it consistently. For “people contacted”, count distinct recipients with outbound sent events. Show incoming replies separately if useful. Remove the unrelated correlation/statistical claim from this compact planning card.

### P2 — Clicking an action does not land at the action

Start Here, the table’s next-action button and the scheduled Jamie follow-up all opened the drawer at its top, focusing Job ad. Your Next Action is below contacts, draft and documents, beyond the initial visible screen. The scheduled contact date is not visible on the contact card; it required Edit/Log to inspect.

**Small remedy:** put Your Next Action near the top; when opening a contact reminder, expand/scroll to that person and show their follow-up date beside their status. Keep one editable source of the action.

### P2 — “No history recorded” after two logged interactions is misleading

The bottom History section stayed empty after the sent/reply logs, while another heading said 2 logged activities. Those records existed only inside the contact’s collapsed Context and activity.

**Small remedy:** label the bottom section “Role changes”, or include contact events in a readable combined history. Preserve contact context without implying the activity vanished.

### P2 — New-task contact option contains “undefined”

The New task Link to selector displayed `☺ Jamie Example (undefined)`, despite the person being attached to Cedar Systems.

**Small remedy:** resolve the employer from the linked opportunity, or omit the parenthetical when no company label exists.

### P3 — Today repeats the same few records across large modules

Initially the real starting action came after a comeback card and a tall incomplete onboarding card. A single new task then appeared three times (Start Here, Next 7 Days, Tasks), and the role action twice. Completing the weekly setup removed the large guide and made the screen much easier to scan.

**Small remedy:** collapse onboarding after the first meaningful record, keep Start Here first, and make the rest a compact dated list. Retain Tasks as the management view, without repeating full cards for the same item.

### P3 — Numeric weekly information is missing from the accessibility tree

The screenshot showed 2 of 2 and 0 of 1, while AX exposed only “messages applications”. A screen-reader user cannot obtain the numbers visible in the rings.

**Small remedy:** give each chart an accessible numeric sentence or adjacent text.

### P3 — Minor language/discoverability inconsistencies

The brand menu says Settings & sync; its page says local-only and Settings & backups. The footer produced “16 change since last exports”. Rename consistently to Backups and fix pluralisation. “Log touch” is less plain than “Log activity”.

## What worked

A useful next action appeared immediately on Today, and changes flowed back to the table and dated list. Contact uncertainty could be captured without inventing an email. Drafting was separate from sent activity. Contact logs retained the supplied text and dates. Task completion/reopening was straightforward. Data survived a reload. The Settings rationale accurately described optional outreach and local limitations.

## Coverage and limits

Exercised Today’s comeback/Getting Started presentation, Start Here, After That, This Week/target/help, Next 7 Days, Tasks/Done and Settings/weekly rationale. The comeback button itself was not clicked; Start Here was used instead. Funnels were not exposed by the three-role/one-contact scenario, so their interactions are untested. Resume, Stories, export/import, mobile layout, actual third-party sending and multi-contact reminder sorting were outside this persona’s hands-on scope.

One route-selection attempt using native keyboard Home/Down/Return closed the contact form before the planned notes entry. I recovered via Edit person and a direct accessible select value. Because CUA’s native select interaction may have contributed, treat this as a retest candidate rather than a confirmed app defect.

The isolated test data remains available on port 8773: one saved synthetic contact, two contact logs, the restored draft, one reopened task, Ready status and updated next-action/follow-up dates. No source code was edited in this pass.

## Implemented retest — 8 September 2026

Used only the same synthetic 8773 browser origin. Refreshed its code while retaining its three synthetic seed roles and browser records; no personal workspace, external link or actual sending service was used.

The role now has a compact square People table. I added Alex Synthetic inline with a title explicitly marked unconfirmed, no email/profile, Unknown / to confirm route, context explaining the uncertainty and a follow-up date. Empty-name save showed inline validation. A second case-insensitive Alex name showed duplicate validation without losing the entry; Cancel removed the unsaved editor. I logged a synthetic sent event and a reply: progress became Reached out then Replied automatically, and the revised follow-up appeared in the table and Today. Jamie's earlier contacts, uncertainty, draft and logs remained present after reload. The contact research helper is available below the table; this pass did not repeat the other persona's research exercise.

The latest requested role Notepad is directly beneath status. I typed free text, a bullet and `- [ ] Ask which team owns handover`. Typing retained focus and displayed Saved in this browser. Clicking its rendered checkbox changed only that source line to `[x]`, kept checkbox focus, and Undo checklist change restored the exact unchecked line with surrounding text intact. Reloading and reopening the role retained all note text. The optional next action/date remains collapsed below the notepad; the existing dated action still appears in Today. No role-note line is automatically turned into a Today task. The final screenshot showed the notepad and two compact People rows in the same drawer, with the redundant visual table caption removed but retained for accessibility.

Automated checks: 10 contact/notepad cases and 23 workflow cases passed. They cover validation, duplicate handling, preserving links/log metadata, activity semantics, storage failure, escaping and note/checklist source preservation. A final contact-save focus return was implemented after the earlier observed body-focus reset; its DOM behavior has not yet been independently clicked again. Mobile CSS has stacked editor fields and contact actions inside expandable details, but I did not change the shared viewport and cannot claim a mobile interaction pass. Full screen-reader use, all keyboard-only paths and provider integration were not tested.

## AI opportunities grounded in this exercise

These are product hypotheses from the synthetic task, not market research or proven uplift. The simple event-to-status mapping is already handled deterministically and does not need AI. Keep the notepad and manual fields useful without a provider.

1. **Turn a selected conversation note into a reviewable update.** I had to hold a reply, uncertain team context, follow-up and next question in mind while updating several fields. On request, propose a short contact-context addition and an optional next action, each tied to the exact selected note excerpt; leave uncertain dates and identities unresolved. Minimum inputs: the selected note, relevant contact record and current role context. Benefit to test: less reconstruction when returning after work. Risks: private conversation content leaving the browser, invented commitments and turning tentative language into fact. Show the exact payload before any external request, do not include the whole workspace or vault, and require acceptance of individual proposed changes. Manual fallback is the existing inline editor/notepad. Effort: medium after provider/authentication/data-handling choices, plus a review/diff interface and representative uncertainty tests. Measure whether users can resume the intended conversation from saved context and how often accepted proposals need factual correction; do not optimize reminders or time spent.

2. **Revise an existing outreach draft without replacing it.** The original outline action destroyed a carefully written draft in this exercise; the immediate preservation bug has been fixed. An optional AI revision could preserve the current text as a recoverable version and offer changes against only the user-selected role, contact context and reviewed evidence. Minimum inputs: current draft, purpose of the message, selected relevant context and any employer AI rule. Benefit to test: helping a busy applicant express a specific question in their own voice. Risks: fabricated familiarity, unsupported achievements, generic tone and unnecessary exposure of a third party's details. Require source support for factual additions, a visible diff and an explicit keep/use choice; never log sent or send automatically. Manual fallback is the current draft editor. Effort: medium; depends on chosen provider, version preservation and review controls. Measure factual corrections and whether the user keeps their own intended meaning, then can recover the chosen draft later; message volume is not success.

3. **Prepare a source-aware research question, not an invented contact.** I deliberately recorded two people with uncertain team membership and no verified contact details. Optional research could identify which public team/source to check and summarize why it might relate to the selected role, with URLs, checked dates and explicit uncertainty. Minimum inputs: verified company/role context and selected public sources/full advertisement; private notes are optional and excluded by default. Benefit to test: fewer repeated searches when resuming the same opportunity. Risks: stale identity/team claims, guessed emails, conflating similar companies and web instructions contaminating output. Keep uncertain people as unconfirmed; no private scraping or inferred contact details. Manual fallback is the existing contact-research brief and user verification. Effort: higher than text revision because retrieval, source verification and stale-result handling are required; provider and data choices remain pending. Measure whether saved source context answers the user's original research question and survives later verification, not number of contacts gathered.

Retention should come from being able to return and recognize the role, people, uncertainties and useful next step without reconstructing the story. None of these options justifies automatic mail/vault sync, bulk applications or notifications designed to pull the user back.

## Superseding shared-checklist decision and retest — 8 September 2026

The user's subsequent direction supersedes the separate Markdown checklist behavior described above. Freeform role notes are unchanged, including any legacy Markdown lines. The structured checklist below the notes now uses the same application-linked task records as Today, without automatic migration or copied task records.

On synthetic 8773 I added “Synthetic shared task: confirm team with Jamie” in Cedar's checklist. Pressing Enter kept the drawer open and focused its next blank row. Closing the drawer showed that task once in Today. I edited its text there to “Synthetic shared task: ask Jamie which team owns handover”, completed it and clicked Undo. Reopening Cedar showed the revised text and unchecked state in its checklist. Reloading retained the same task and the prior freeform/Markdown note text. The final screenshot showed matching text in Today behind the drawer and within the role. The optional outreach section was collapsed, preserving its draft for expansion. No personal data or external activity was used.

Six isolated shared-task checks cover shared record identity, distinct fresh-input IDs, completion/reload representation, archive hide/restore behavior, failed-save retry and Restore buttons for archived closed/rejected roles. Contact/notepad checks remain 10 and workflow checks 23, all passing. Completion/Undo was actually clicked in the browser; archive/restore in this pass was checked through synthetic rendering/state tests rather than another browser journey.
