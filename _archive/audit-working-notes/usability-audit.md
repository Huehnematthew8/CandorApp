# Independent usability and functionality audit

Baseline: `/Users/matthewhuehne/Desktop/Code/candor_final/src`, read-only code review, 8 September 2026. This is source evidence, not a claim of completed browser testing. Reviewed project AGENTS.md and bundled Next client-component documentation. No secrets or external services accessed.

## Prioritised findings

1. **P1 — Drafts and failed saves lose work.** EmailDrafter:25–30, CoverLetterDrafter:25–32 and InterviewPrep:22–24 store drafts only in component state. ActivityTab:97–116 unmounts them on Back, another mode or tab navigation. Generation clears the previous draft before the request succeeds (EmailDrafter:49; CoverLetterDrafter:37). NotesSection:40–47 clears the editor without awaiting the save. LogInteractionModal:36–41 and ActivityTab:81–88 close after `addInteraction`, whose store implementation returns normally on failure (useAppStore:345–348). Reproduce with a failed write or simply navigating away. Persist draft state, retain old versions, and only clear/close after successful writes.

2. **P1 — Send label asserts an action that does not happen.** EmailDrafter:91–94 and 265–267 labels a button “Send & Log”, but it only calls the store insertion and discards the To field. There is no mail transport. Rename to a factual save/log action and keep explicit sent state separate from drafts; preserve recipient context.

3. **P1 — Company text can crash drafting.** EmailDrafter:37 builds `new RegExp(job.company.toLowerCase(), 'g')` without escaping. A company called `[` raises SyntaxError after the body exceeds 50 characters. Remove the metric or use literal text matching. The displayed personalisation meter is an unsupported heuristic rewarding company repetition and length (37–40,257–262), not an assessment of truthful tailoring.

4. **P1 — Mail scan simulation misrepresents access.** TopNav:90–163 builds “Gmail” findings entirely from saved roles and elapsed days, with timeout animation. No mailbox is inspected. Remove simulated scan UI or identify the functionality honestly as local reminders.

5. **P1 — Workflow statuses cannot express known outcomes.** types/index.ts:1–9 only includes saved/applied/interview stages/offer/rejected. A listing unavailable or closed is not a rejection. Add separate closed/withdrawn states and preserve original evidence. NextActionCard:16–31 prescribes drafting/follow-up by status and elapsed time, not a user-defined next action; saved “Draft now” opens email via DetailView rather than the promised cover letter.

6. **P2 — Main editing controls are inaccessible by keyboard.** TableView:216–230,246,366,444,471,513 uses clickable div/span elements for editing and status/group selection without tabIndex or keyboard handlers. Sorting headers at 624 have the same issue. Opening details does have a native button (675), so the whole table is not inaccessible. InterviewPrep:209 uses a clickable div as checkbox. Use native buttons, selects and checkboxes.

7. **P2 — Modals lack dialog semantics and focus management.** AddJobModal and LogInteractionModal use overlay divs, no dialog role, focus trap, Escape handler or focus restoration. Contacts inputs use visual div labels without accessible label association. Native dialog and label elements offer a small reliable fix.

8. **P2 — Narrow screen activity view clips.** ActivityTab:140–162 locks a 210px sidebar next to the centre; InterviewPrep:139 locks another 248px checklist beside notes. The surrounding views use overflow:hidden. globals.css:462–506 only adapts modal/dropdown/basic control classes, not these panels. At phone widths there is insufficient space for the centre. Stack panels at a breakpoint and verify at 390px. TableView's 780px table in a scrolling container is a lesser usability limitation.

9. **P2 — Group move leaves inconsistent in-memory nesting.** updateJob:238–243 changes a job's group_id inside its existing group.jobs array without moving it. Reload regroups correctly, but group-derived state can disagree before reload. Rebuild group membership on each update.

10. **P2 — Prep checklist content disappears even after logging.** InterviewPrep:51–57 saves only the completed-item count and notes; labels and checked states are discarded. Preserve the checklist if it is retained as a feature.

## Positive baseline

Company/role search, manual contact creation, explicit interaction logging, local editorial notes, a readable visual hierarchy and consistent purple/light styling are useful foundations. AI drafting is a real API call, not static generated text; nevertheless availability and truthful source grounding require separate work. The strongest lean improvement is reliable role/context/contact/next-action tracking with recoverable evidence-linked drafts rather than more generation controls.

## Recommended verification

Create a role with punctuation and an optional URL; reject unsupported URL protocols; preserve fields on duplicate/failure; edit and reload; record unavailable separately from rejected; archive and restore; navigate add-role dialog using Tab/Shift+Tab/Escape; inspect 390px and desktop layouts; test failed storage and backup recovery without touching real user records.
