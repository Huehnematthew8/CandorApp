# Candor

A local workspace for thoughtful job applications: roles, notes, checklists, people and career evidence. The current app is **`app.html`**, based on Matthew’s supplied standalone prototype. Product purpose and decisions live in [PRODUCT-CONTEXT.md](PRODUCT-CONTEXT.md).

## Open the app

From this folder, run:

```sh
python3 scripts/preview.py
```

Open [Candor](http://127.0.0.1:8770/app.html). The preview serves only the app on this computer. No package installation, account or API key is needed. Stop the preview with Control-C. If it is already running, use the link above.

Start on **Today** or use **New → Role**. Inside a role, write in the notepad and add checklist rows as needed. Role checklist items also appear in Today; both views edit the same task. Free text stays in the notepad. Add contacts directly in the People table; detailed activity and outreach are optional. Use Resume and Stories for evidence and tailored documents. Settings contains backups and the product rationale.

The app defaults to light mode. Your explicit light/dark choice is remembered in this browser.

## Keep your records

Changes save in this browser’s local storage. Use the same browser profile and preview address to return to them. Browser storage is separate from the HTML file and Obsidian vault: copying `app.html` does not copy your saved records.

Download a JSON backup in Settings before moving devices, changing browser profiles, clearing browser data or importing another workspace. Backups include private career and contact information. Import validates a backup and retains the preceding saved state for recovery. There is no automatic vault sync, connected AI, email sending or application submission.

## Files and verification

- `app.html`: the canonical app to use and improve.
- `PRODUCT-CONTEXT.md`: rationale, decisions and scope.
- `AUDIT.md`: findings, implemented changes, scenario coverage and limitations.
- `AI-OPPORTUNITIES.md`: ranked future assistance, evidence requirements and decisions before connecting a provider.
- `scripts/preview.py`: local preview server.
- `scripts/*tests.cjs`: isolated checks of persistence, recovery, evidence, contacts, tasks and appearance. Run each with Node. Browser checks are also needed for keyboard and responsive behaviour.
- `_archive/next-candidate-with-preliminary-fixes/`: preliminary alternate work, not completed or verified as an app.
- `_archive/user-attachment-20260908/app.html`: untouched supplied original.
- `_archive/original-sources-20260908-132735/`: preserved earlier source variants, with original file checksums. Those are reference copies, not the current entrypoint. The public portfolio is a separate project.

This is an evolving local app. Automated checks and browser verification support specific journeys; they do not establish production readiness or hiring outcomes.
