# Candor

A local workspace for thoughtful job applications: roles, people, conversations, evidence and the next action. The current app is **`app.html`**, based on Matthew’s supplied standalone prototype. Product purpose and decisions live in [PRODUCT-CONTEXT.md](PRODUCT-CONTEXT.md).

## Open the app

From this folder, run:

```sh
python3 scripts/preview.py
```

Open [Candor](http://127.0.0.1:8770/app.html). The preview serves only the app on this computer. No package installation, account or API key is needed. Stop the preview with Control-C. If it is already running, use the link above.

Use **New → Role**, or open an existing opportunity. Check the listing/context, add a relevant contact if useful, and set your next action. Use Resume and Stories for evidence and tailored documents; Settings contains the product rationale and backup controls.

## Keep your records

Changes save in this browser’s local storage. Use the same browser profile and preview address to return to them. Browser storage is separate from the HTML file and Obsidian vault: copying `app.html` does not copy your saved records.

Download a JSON backup in Settings before moving devices, changing browser profiles, clearing browser data or importing another workspace. Backups include private career and contact information. Import validates a backup and retains the preceding saved state for recovery. There is no automatic vault sync, connected AI, email sending or application submission.

## Files and verification

- `app.html`: the canonical app to use and improve.
- `PRODUCT-CONTEXT.md`: rationale, decisions and scope.
- `AUDIT.md`: findings, implemented changes, verification and limitations.
- `scripts/preview.py`: local preview server.
- `scripts/security-tests.cjs` and `scripts/workflow-tests.cjs`: isolated checks of validation, recovery, persistence and application/evidence behaviour. Run with `node scripts/security-tests.cjs` and `node scripts/workflow-tests.cjs`. Browser checks are also needed for keyboard and responsive behaviour.
- `_archive/next-candidate-with-preliminary-fixes/`: preliminary alternate work, not completed or verified as an app.
- `_archive/user-attachment-20260908/app.html`: untouched supplied original.
- `_archive/original-sources-20260908-132735/`: preserved earlier source variants, with original file checksums. Those are reference copies, not the current entrypoint. The public portfolio is a separate project.

This is an evolving local app. Automated checks and browser verification support specific journeys; they do not establish production readiness or hiring outcomes.
