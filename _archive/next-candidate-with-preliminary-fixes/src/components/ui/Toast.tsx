'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastContextValue {
  toast: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const toast = useCallback((text: string) => {
    setMessage(text);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2700);
    return () => clearTimeout(timer);
  }, [visible, message]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '18px',
          padding: '9px 14px',
          borderRadius: '8px',
          background: 'var(--s2)',
          border: '1px solid var(--b3)',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '12px',
          color: 'var(--t1)',
          zIndex: 200,
          transform: visible ? 'translateY(0)' : 'translateY(44px)',
          opacity: visible ? 1 : 0,
          transition: 'all .22s ease',
          pointerEvents: 'none',
          boxShadow: '0 8px 28px rgba(0,0,0,.4)',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--glow)',
            border: '1px solid rgba(201,170,126,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="8" height="8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="var(--gold)">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span>{message}</span>
      </div>
    </ToastContext.Provider>
  );
}
