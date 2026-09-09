/**
 * Lightweight HTML sanitizer — strips everything except safe formatting tags.
 * Removes all attributes except href on <a> tags (and forces target=_blank, rel=noopener).
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') {
    // SSR fallback: strip all tags
    return html.replace(/<[^>]*>/g, '');
  }
  const SAFE_TAGS = new Set([
    'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'p', 'div',
    'ul', 'ol', 'li', 'a', 'span', 'blockquote', 'code', 'pre', 'h1',
    'h2', 'h3', 'h4', 'h5', 'h6', 'sub', 'sup',
  ]);

  const doc = new DOMParser().parseFromString(html, 'text/html');
  function clean(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!SAFE_TAGS.has(tag)) {
      // Keep children, drop the tag
      const frag = document.createDocumentFragment();
      el.childNodes.forEach((child) => {
        const cleaned = clean(child);
        if (cleaned) frag.appendChild(cleaned);
      });
      return frag;
    }
    const newEl = document.createElement(tag);
    if (tag === 'a') {
      const href = el.getAttribute('href');
      if (href && !href.startsWith('javascript')) {
        newEl.setAttribute('href', href);
        newEl.setAttribute('target', '_blank');
        newEl.setAttribute('rel', 'noopener noreferrer');
      }
    }
    el.childNodes.forEach((child) => {
      const cleaned = clean(child);
      if (cleaned) newEl.appendChild(cleaned);
    });
    return newEl;
  }
  const frag = document.createDocumentFragment();
  doc.body.childNodes.forEach((child) => {
    const cleaned = clean(child);
    if (cleaned) frag.appendChild(cleaned);
  });
  const wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper.innerHTML;
}

/** Days elapsed since an ISO date string. Returns null if no date. */
export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 864e5);
}

/** Short date display, e.g. "1 Apr 2026" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
