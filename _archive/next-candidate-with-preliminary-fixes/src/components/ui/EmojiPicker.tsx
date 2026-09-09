'use client';

import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  triggerStyle?: CSSProperties;
  triggerHoverStyle?: CSSProperties;
}

// Broad categories for any job seeker across all industries
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Industry',
    emojis: [
      '💻', '🏥', '⚖️', '🎓', '🏦', '🏗️', '🎨', '🍽️',
      '✈️', '🛒', '📺', '🔬', '🏭', '🚗', '🎮', '🌾',
      '🏛️', '🎵', '📸', '🏨', '🛡️', '🧬', '📰', '🚢',
      '⚡', '🌍', '🏋️', '🎭', '🏪', '🛸', '🧪', '🌱',
    ],
  },
  {
    label: 'Work',
    emojis: [
      '💼', '📊', '📋', '🤝', '📈', '💡', '🔑', '📝',
      '🏢', '📡', '⚙️', '🛠️', '📎', '✉️', '📤', '🗂️',
      '💰', '🪙', '📉', '🧭', '📣', '🖥️', '📱', '☁️',
      '🔒', '📐', '🧩', '🔗', '📇', '🖨️', '⌨️', '🗃️',
    ],
  },
  {
    label: 'Status',
    emojis: [
      '🎯', '🚀', '⭐', '🔥', '🏆', '💎', '👑', '💯',
      '✅', '⏳', '📌', '🔔', '🏁', '🥇', '🎖️', '✨',
      '🌟', '💫', '⚡', '🧠', '💪', '🎬', '⏰', '🏅',
      '🥈', '🥉', '🎗️', '🔮', '🗝️', '🪜', '🎁', '🏄',
    ],
  },
  {
    label: 'Feel',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🌊', '🌴', '☀️', '🌙', '🌈', '🦋', '🍀', '🌸',
      '🌍', '🌱', '🏔️', '🌿', '☕', '🥂', '🎉', '🪩',
      '🔵', '🟣', '🟢', '🟡', '🔴', '⚫', '⬜', '🟠',
    ],
  },
];

export default function EmojiPicker({ value, onChange, triggerStyle, triggerHoverStyle }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside click: close if click is outside both trigger and dropdown
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Position the dropdown relative to trigger
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 220; // approximate height
    const fitsBelow = rect.bottom + 6 + dropH < window.innerHeight;
    setPos({
      top: fitsBelow ? rect.bottom + 6 : rect.top - dropH - 6,
      left: rect.left,
    });
  }, []);

  useEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  // Trigger button styles
  const { border: triggerBorder, ...restTrigger } = triggerStyle || {};

  let idleBorderColor = 'var(--b1)';
  if (triggerStyle?.borderColor != null && !triggerBorder) {
    idleBorderColor = String(triggerStyle.borderColor);
  } else if (typeof triggerBorder === 'string') {
    const m = triggerBorder.trim().match(/^\S+\s+\S+\s+(.+)$/);
    if (m) idleBorderColor = m[1].trim();
  }

  const borderColor =
    open ? 'var(--gold)'
    : hovered
      ? (triggerHoverStyle?.borderColor != null ? String(triggerHoverStyle.borderColor) : 'var(--b3)')
      : idleBorderColor;

  const background = open
    ? 'var(--bg)'
    : hovered && triggerHoverStyle?.background != null
      ? String(triggerHoverStyle.background)
      : (restTrigger.background as string | undefined) || 'var(--s2)';

  const btnStyle: CSSProperties = {
    width: '44px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    ...restTrigger,
    ...(hovered ? triggerHoverStyle : {}),
    background,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor,
  };

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: '280px',
        background: 'var(--s1)',
        border: '1px solid var(--b3)',
        borderRadius: '14px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'dropdown-in 0.18s ease both',
        overflow: 'hidden',
      }}
    >
      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)', padding: '6px 6px 0', gap: '2px' }}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveCategory(i)}
            style={{
              flex: 1,
              padding: '5px 0 7px',
              fontSize: '9px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: activeCategory === i ? 'var(--gold)' : 'var(--t3)',
              background: 'none',
              border: 'none',
              borderBottom: activeCategory === i ? '2px solid var(--gold)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emoji grid — 4 rows of 8 */}
      <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' }}>
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => { onChange(emoji); setOpen(false); }}
            style={{
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              background: value === emoji ? 'var(--glow)' : 'transparent',
              border: value === emoji ? '1px solid rgba(201,170,126,.25)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => {
              if (value !== emoji) {
                e.currentTarget.style.background = 'var(--s3)';
                e.currentTarget.style.transform = 'scale(1.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== emoji) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={triggerRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={btnStyle}
        title="Change icon"
      >
        {value || '📂'}
      </button>
      {dropdown}
    </div>
  );
}
