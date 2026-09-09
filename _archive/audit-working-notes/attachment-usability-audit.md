# Attached app.html: independent usability audit

Reviewed the user's supplied standalone HTML on 8 September 2026. Scope: keyboard access, screen-reader semantics and narrow screens. Source inspection and composed-script syntax check completed; browser verification remains required after integration. No application records were changed by this review.

| Priority | Finding | Consequence | Proposed correction |
| --- | --- | --- | --- |
| P1 | Global `.cell-in` key handler captures ArrowUp/ArrowDown on native selects and prevents their defaults. | Keyboard users cannot change a stage/market in the expected way; focus moves between rows instead. | Retain row-navigation shortcut for text fields; allow native select behaviour. |
| P1 | `.pill-items`, `.addmenu` and `.markmenu` use width/opacity/pointer-events to hide. | Invisible buttons remain in Tab order and screen-reader navigation. | Synchronise `inert`/`aria-hidden` with menu state and use CSS visibility. |
| P2 | Modal system focuses an input but lacks dialog semantics, containment and restoration; role drawer has the same issue. | Tab reaches background controls, focus is lost on dismissal, overlay context is unclear. | Labelled dialog, inert background, Tab/Shift+Tab containment, Escape handling, return focus. |
| P2 | Most generated `.field`/`.dfield` labels lack `for`; sheet inputs and selection checkboxes are unnamed. | Users hear anonymous controls in forms or tables. | Associate labels and contextualise sheet input names with company/role. |
| P2 | Sortable th and ready/people/next-action td use delegated pointer handlers. | Sorting and several drill-down controls are unavailable from keyboard. | Native buttons inside cells/headers; preserve header semantics and expose aria-sort. |
| P2 | Navigation expands horizontally; resume uses a fixed 208px rail; form grids stay in two columns. | Mobile content is squeezed or navigation extends offscreen. | Floating wrapped menu on small screens, stacked resume rail/form, wrapping toolbars. |
| P2 | Toast container has no live-region semantics. | Save/error/undo feedback is not announced. | Polite status region announcing additions. |
| P2 | Light-theme muted text #898781 on light surfaces is too low contrast for its small font sizes. | Subtle but important labels are difficult to read. | Darken light-theme muted token; retain theme and hierarchy. |
| P3 | Only one decorative animation observes reduced motion; edit controls are hover-only in task rows. | Motion preference and keyboard focus indication are inconsistent. | Reduced-motion override; reveal edit controls on focus and narrow screens. |

Prepared an isolated, unapplied patch at `scripts/accessibility-patch.py`. It changes presentation/semantics and keyboard handling, not state schema or records. The patch refuses duplicate application and checks that the original keyboard handler is still recognisable before editing. Application is coordinated with the main task to avoid overwriting concurrent changes.

Representative verification after integration: navigate all menus by Tab; open/close a role and modal with keyboard; cycle first/last form controls; operate status select using arrow keys; sort table using Enter; check names of required company/role and row selectors; inspect Today/Roles/Resume and modal at 390px and desktop widths; ensure no new console errors, hidden focus targets or page-width overflow outside the intentionally scrollable sheet.
