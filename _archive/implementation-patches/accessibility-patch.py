"""Apply the reviewed Candor attachment accessibility patch to an explicit HTML path.
Does not run automatically. Refuses repeated application; no data/schema mutations.
Usage: python3 scripts/accessibility-patch.py app.html
"""
from pathlib import Path
import sys

STYLE = r'''
/* Candor accessibility and narrow-screen pass */
:root[data-theme="light"] { --muted: #696761; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.navzone:not(.open) .pill-items, .addwrap:not(.open) .addmenu, .markwrap:not(.open) .markmenu { visibility: hidden; }
.trow:focus-within .rmini { opacity: 1; }
.a11y-cell-button { display: block; width: 100%; text-align: inherit; padding: 7px 10px; min-height: 34px; }
.a11y-sort-button { display: inline-flex; align-items: center; text-align: left; min-height: 34px; }
.modal-foot { flex-wrap: wrap; }
.modal { overflow-wrap: anywhere; }
#toasts { max-width: calc(100vw - 40px); }
@media (max-width: 760px) {
  .navzone { position: static; }
  .navpill { backdrop-filter: none; -webkit-backdrop-filter: none; }
  .navzone .pill-items { position: fixed; top: 80px; left: 12px; right: 12px; width: auto !important; max-height: calc(100dvh - 110px); overflow: auto; background: var(--nav-bg); border: 1px solid var(--nav-ring); border-radius: 18px; box-shadow: var(--shadow-lg); }
  .pill-items-in { flex-wrap: wrap; padding: 10px; white-space: normal; }
  .navzone.open .pill-items-in { pointer-events: auto; }
  .pill-items-in button { flex: 1 0 40%; min-height: 44px; }
  .res-shell { flex-direction: column; overflow-y: auto; }
  .res-rail { width: 100%; max-height: 200px; flex-shrink: 0; border-right: 0; border-bottom: 1px solid var(--hairline); }
  .res-main { padding: 16px 12px 50px; flex: 1 0 auto; overflow: visible; }
  .sheet-bar { flex-wrap: wrap; }
  .sheet-bar #app-q { max-width: none; flex: 1; min-width: 150px; }
  .sheet-chips { flex-wrap: wrap; }
  .sheet-foot { flex-wrap: wrap; gap: 8px; }
  .content { padding-left: 12px; padding-right: 12px; }
  .fgrid { grid-template-columns: 1fr; }
  .modal-back { padding: 12px 8px; }
  .modal { padding: 18px 16px; }
  .dhead { flex-wrap: wrap; padding: 18px 14px; }
  .dbody { padding-left: 14px; padding-right: 14px; }
  .drow, .sc-actions { flex-wrap: wrap; }
  .trow .rmini { opacity: 1; }
  .btn, .chip, .rmini, .chev-open { min-height: 36px; }
  .drawer { width: 100vw; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
'''

SCRIPT = r'''
/* Candor accessibility enhancements: UI semantics only; application data untouched. */
(function installCandorAccessibility() {
  let fieldId = 0, previousOverlay = null, returnFocus = null, lastTrigger = null;
  const focusable = root => Array.from(root.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.disabled && !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  document.addEventListener('pointerdown', e => { if (e.target instanceof Element) lastTrigger = e.target.closest('button, input, select, textarea, a, [tabindex]'); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') lastTrigger = document.activeElement; }, true);

  function enhance() {
    const app = document.getElementById('app');
    const view = document.getElementById('view');
    if (view) { view.setAttribute('role', 'main'); view.setAttribute('aria-label', 'Job search workspace'); }
    const toasts = document.getElementById('toasts');
    if (toasts) { toasts.setAttribute('role', 'status'); toasts.setAttribute('aria-live', 'polite'); toasts.setAttribute('aria-relevant', 'additions'); }
    [['.pill-items', '.navzone'], ['#addmenu', '.addwrap'], ['#markmenu', '.markwrap']].forEach(([selector, parent]) => {
      const menu = document.querySelector(selector);
      if (menu) { const closed = !menu.closest(parent).classList.contains('open'); menu.inert = closed; menu.setAttribute('aria-hidden', String(closed)); }
    });
    document.querySelectorAll('.field, .dfield').forEach(field => {
      const label = field.querySelector('label'), control = field.querySelector('input, select, textarea');
      if (label && control) { if (!control.id) control.id = 'candor-field-' + (++fieldId); label.htmlFor = control.id; }
    });
    document.querySelectorAll('th[data-action="sort"]').forEach(th => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'a11y-sort-button';
      button.dataset.action = 'sort'; button.dataset.key = th.dataset.key;
      th.setAttribute('scope', 'col');
      th.setAttribute('aria-sort', tableSort.key === th.dataset.key ? (tableSort.dir === 1 ? 'ascending' : 'descending') : 'none');
      while (th.firstChild) button.appendChild(th.firstChild);
      th.removeAttribute('data-action'); th.appendChild(button);
    });
    document.querySelectorAll('td[data-action="open-role"]').forEach(td => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'a11y-cell-button';
      button.dataset.action = 'open-role'; button.dataset.id = td.dataset.id;
      const role = state.applications.find(a => a.id === td.dataset.id);
      button.setAttribute('aria-label', 'Open ' + (role ? role.company + ' ' + role.role : 'role') + ': ' + (td.textContent.trim() || 'readiness details'));
      while (td.firstChild) button.appendChild(td.firstChild);
      td.removeAttribute('data-action'); td.appendChild(button);
    });
    document.querySelectorAll('input, select, textarea').forEach(control => {
      if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || (control.labels && control.labels.length)) return;
      const row = control.dataset.id && state.applications.find(a => a.id === control.dataset.id);
      const col = control.dataset.cell && SHEET_COLS.find(c => c.k === control.dataset.cell);
      let label = col ? col.lab + (row ? ' — ' + row.company + ' ' + row.role : '') : '';
      if (control.dataset.action === 'sel-row') label = 'Select ' + (row ? row.company + ' ' + row.role : 'role');
      if (control.dataset.action === 'sel-all') label = 'Select all visible roles';
      if (control.id === 'app-q') label = 'Search roles';
      if (control.id === 'ad-paste') label = 'Job ad text';
      if (control.dataset.dcell === 'draft') label = 'Outreach draft';
      if (!label) label = control.name || control.title || control.placeholder || 'Value';
      control.setAttribute('aria-label', label);
    });
    document.querySelectorAll('[data-action="close-modal"]').forEach(button => { if (button.classList.contains('x')) { button.type = 'button'; button.setAttribute('aria-label', 'Close dialog'); } });
    document.querySelectorAll('.dclose').forEach(button => button.setAttribute('aria-label', 'Close role details'));
    const modal = document.querySelector('#modal-back .modal');
    const drawerHost = document.getElementById('drawer-host');
    const drawer = drawerHost && drawerHost.classList.contains('open') ? drawerHost.querySelector('.drawer') : null;
    const overlay = modal || drawer;
    if (app) app.inert = Boolean(overlay);
    if (drawerHost) drawerHost.inert = Boolean(modal) || !drawer;
    if (overlay) {
      overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.tabIndex = -1;
      const title = overlay.querySelector('h3, .dh-co');
      overlay.setAttribute('aria-label', title ? title.textContent.replace('✕', '').trim() : 'Role details');
      const kind = modal ? 'modal' : 'drawer';
      if (!previousOverlay) returnFocus = lastTrigger || document.activeElement;
      if (previousOverlay !== kind && !overlay.contains(document.activeElement)) (focusable(overlay)[0] || overlay).focus();
      previousOverlay = kind;
    } else if (previousOverlay) {
      previousOverlay = null;
      const target = returnFocus && returnFocus.isConnected && !returnFocus.closest('[inert]') ? returnFocus : document.getElementById('add-orb');
      if (target) target.focus();
      returnFocus = null;
    }
  }
  document.addEventListener('keydown', e => {
    const overlay = document.querySelector('#modal-back .modal') || document.querySelector('.drawer-host.open .drawer');
    if (!overlay) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (document.getElementById('modal-back')) closeModal();
      else { openRoleId = null; render(); }
      enhance(); return;
    }
    if (e.key === 'Tab') {
      const nodes = focusable(overlay), first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); overlay.focus(); }
      else if (e.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  }, true);
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  enhance();
})();
'''

def patch(text: str) -> str:
    if 'installCandorAccessibility' in text:
        raise SystemExit('Accessibility patch already present; refusing duplicate application.')
    old = "if (t.classList && t.classList.contains('cell-in') && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {"
    if text.count(old) != 1:
        raise SystemExit('Expected sheet key handler changed; review before patching.')
    text = text.replace(old, "if (t.tagName !== 'SELECT' && t.classList && t.classList.contains('cell-in') && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {")
    if '</style>' not in text or '</script>' not in text:
        raise SystemExit('Expected standalone HTML style/script not found.')
    text = text.replace('</style>', STYLE + '\n</style>', 1)
    index = text.rfind('</script>')
    return text[:index] + SCRIPT + '\n' + text[index:]

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Pass the exact HTML path to patch.')
    target = Path(sys.argv[1])
    text = target.read_text()
    result = patch(text)
    target.write_text(result)
    print(f'Accessibility patch applied to {target}')
