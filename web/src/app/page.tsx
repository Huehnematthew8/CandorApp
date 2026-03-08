"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg)]">
      {/* Slow-moving minimal background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="animate-landing-pulse absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 55%)" }}
        />
        <div
          className="animate-landing-drift absolute left-[20%] top-[30%] h-[80vmax] w-[80vmax] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, var(--blue) 0%, transparent 60%)" }}
        />
        <div
          className="animate-landing-drift-reverse absolute right-[15%] bottom-[25%] h-[70vmax] w-[70vmax] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, var(--purple) 0%, transparent 60%)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-10 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
          />
          <span className="font-serif text-xl tracking-[0.02em] text-[var(--text)]">Candor</span>
        </div>

        <h1 className="mb-4 font-serif text-[clamp(36px,5vw,52px)] font-normal leading-[1.1] tracking-[-0.02em] text-[var(--text)]">
          Hunt smarter.
          <br />
          Apply with <em className="italic text-[var(--accent)]">intention.</em>
        </h1>
        <p className="mb-14 max-w-[420px] text-[15px] font-light leading-relaxed text-[var(--text-muted)]">
          Your job application intelligence — tailored applications, one place for every role.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-[var(--border2)] bg-[var(--surface2)] px-8 py-3.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--border2)] hover:bg-[var(--surface3)]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-8 py-3.5 text-sm font-medium text-[#1a1508] transition-all hover:bg-[var(--accent2)]"
            style={{ boxShadow: "0 8px 24px rgba(200,169,126,0.25)" }}
          >
            Create account
          </Link>
        </div>

        <p className="mt-10 text-[13px] text-[var(--text-dim)]">
          Your data stays yours. Never shared.
        </p>
      </div>
    </div>
  );
}
