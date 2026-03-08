"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleAccountsId = {
  initialize: (c: unknown) => void;
  renderButton: (el: HTMLElement, o: unknown) => void;
};
type WindowWithGoogle = {
  google?: { accounts: { id: GoogleAccountsId } };
  __gsiLoaded?: boolean;
};

type GmailSyncConsentModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (idToken: string) => void;
  onError?: (message: string) => void;
};

export function GmailSyncConsentModal({
  open,
  onClose,
  onSuccess,
  onError,
}: GmailSyncConsentModalProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) return;
    const g = typeof window !== "undefined" ? (window as unknown as WindowWithGoogle).google : undefined;
    if (g?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const onLoad = () => setScriptReady(true);
    if ((window as unknown as WindowWithGoogle).__gsiLoaded) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !scriptReady || !buttonRef.current || !GOOGLE_CLIENT_ID) return;
    const g = (window as unknown as WindowWithGoogle).google;
    if (!g?.accounts?.id) return;
    g.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          onError?.("Sign-in was cancelled.");
        }
      },
    });
    buttonRef.current.innerHTML = "";
    g.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      width: 280,
    });
  }, [open, scriptReady, onSuccess, onError]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gmail-consent-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="gmail-consent-title" className="font-serif text-lg text-[var(--text)]">
          Connect Gmail with Candor
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Candor can sync with your Gmail to give you <strong className="text-[var(--text)]">status updates</strong> and{" "}
          <strong className="text-[var(--text)]">messages tailored to your job application process</strong>, and to link
          emails associated with each role so you can track conversations in one place.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Are you okay with syncing Gmail for this?
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div ref={buttonRef} />
          {!GOOGLE_CLIENT_ID && (
            <p className="text-xs text-[var(--text-dim)]">Google sign-in not configured (missing client ID).</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--text-dim)] underline hover:text-[var(--text-muted)]"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
