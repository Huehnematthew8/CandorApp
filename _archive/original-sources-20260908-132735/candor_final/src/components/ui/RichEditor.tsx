'use client';

import { useRef, useEffect, useCallback, type CSSProperties } from 'react';

interface RichEditorProps {
  defaultValue?: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  /** Called on Enter (no shift) instead of inserting a newline — skipped when cursor is inside a list item */
  onEnterSave?: () => void;
  placeholder?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
}

/** Returns true if the selection is currently inside a <li> element */
function cursorInsideListItem(sel: Selection, root: HTMLElement): boolean {
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node && node !== root) {
    if ((node as Element).tagName === 'LI') return true;
    node = node.parentNode;
  }
  return false;
}

export default function RichEditor({
  defaultValue = '',
  onChange,
  onBlur,
  onEnterSave,
  placeholder,
  style,
  autoFocus,
}: RichEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Set initial content on mount only
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = defaultValue;
    if (autoFocus) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);

      const sel = window.getSelection();
      const inList = !!(sel && sel.rangeCount > 0 && cursorInsideListItem(sel, ref.current));

      // ── Cmd/Ctrl + B → bold ──────────────────────────────────
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold');
        onChange?.(ref.current.innerHTML);
        return;
      }

      // ── Cmd/Ctrl + I → italic ─────────────────────────────
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic');
        onChange?.(ref.current.innerHTML);
        return;
      }

      // ── Tab inside a list item → indent / outdent ────────────
      if (e.key === 'Tab' && inList) {
        e.preventDefault();
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        onChange?.(ref.current.innerHTML);
        return;
      }

      // ── Enter inside a list → create new bullet or exit list ─
      // Handled explicitly because browser native behaviour is unreliable.
      if (e.key === 'Enter' && !e.shiftKey && inList && sel && sel.rangeCount > 0) {
        e.preventDefault();

        // Find the current <li>
        let liNode: Node | null = sel.getRangeAt(0).startContainer;
        while (liNode && liNode !== ref.current) {
          if ((liNode as Element).tagName === 'LI') break;
          liNode = liNode.parentNode;
        }
        if (!liNode || liNode === ref.current) return;
        const liEl = liNode as HTMLElement;

        if (!liEl.textContent?.trim()) {
          // Empty li → exit list: insert a plain div after the <ul>
          const ul = liEl.parentElement!;
          liEl.remove();
          if (!ul.children.length) ul.remove();
          const div = document.createElement('div');
          div.appendChild(document.createElement('br'));
          if (ul.parentNode) {
            ul.parentNode.insertBefore(div, ul.nextSibling);
          } else {
            ref.current.appendChild(div);
          }
          const newRange = document.createRange();
          newRange.setStart(div, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Non-empty li → add a new empty bullet after
          const newLi = document.createElement('li');
          newLi.appendChild(document.createElement('br'));
          liEl.parentNode!.insertBefore(newLi, liEl.nextSibling);
          const newRange = document.createRange();
          newRange.setStart(newLi, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        onChange?.(ref.current.innerHTML);
        return;
      }

      // ── Enter → save only when NOT inside a list item ────────
      if (e.key === 'Enter' && !e.shiftKey && onEnterSave && !inList) {
        e.preventDefault();
        onEnterSave();
        return;
      }

      // ── "- " at start of a block → Notion-style bullet list ──
      // Triggers on Space when the only text before the cursor is "-".
      if (e.key === ' ' && sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.startContainer;

        if (container.nodeType === Node.TEXT_NODE) {
          const text = container.textContent ?? '';
          const offset = range.startOffset;
          const before = text.slice(0, offset);

          if (before === '-') {
            e.preventDefault();

            // Erase the "-" — leave any text that was already after the cursor
            (container as Text).textContent = text.slice(offset);

            // Move cursor to the start of the (now empty / remaining) text
            const newRange = document.createRange();
            newRange.setStart(container, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);

            // Convert the current block into a <ul><li>
            // From here the browser handles everything:
            //   Enter         → new <li>
            //   Enter on empty <li> → exits list, new paragraph
            //   Tab / Shift+Tab → handled above
            document.execCommand('insertUnorderedList');
            onChange?.(ref.current.innerHTML);
          }
        }
      }
    },
    [onChange, onEnterSave],
  );

  const handleInput = useCallback(() => {
    onChange?.(ref.current?.innerHTML ?? '');
  }, [onChange]);

  const handleBlur = useCallback(() => {
    onBlur?.(ref.current?.innerHTML ?? '');
  }, [onBlur]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onBlur={handleBlur}
      data-placeholder={placeholder}
      style={{ outline: 'none', ...style }}
    />
  );
}
