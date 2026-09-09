import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background orbs (match original) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-30%] h-[600px] w-[900px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(200,169,126,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(91,139,212,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 80% 20%, rgba(139,111,212,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[680px] px-6 py-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Brand mark */}
        <div className="mb-14 flex items-center gap-2.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
          />
          <span className="font-serif text-lg tracking-[0.02em] text-[var(--text)]">Candor</span>
        </div>

        <h1 className="mb-5 font-serif text-[clamp(40px,6vw,64px)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--text)]">
          Hunt smarter.
          <br />
          Apply with <em className="italic text-[var(--accent)]">intention.</em>
        </h1>
        <p className="mb-12 max-w-[480px] text-base font-light leading-relaxed text-[var(--text-muted)]">
          Drop your resume and Candor builds your personal intelligence layer — tailoring every
          application to who you actually are, not a generic template.
        </p>

        {/* Drop zone (match original structure) */}
        <Link
          href="/dashboard"
          className="group relative block overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[var(--border2)] bg-[var(--surface)] p-[52px_40px] text-center transition-all duration-300 hover:border-[var(--accent)] hover:bg-[var(--surface2)]"
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-[var(--border2)] bg-[var(--surface3)] transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-[22px] w-[22px]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="var(--accent)"
            >
              <path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
            </svg>
          </div>
          <div className="relative z-10 text-base font-medium text-[var(--text)]">Drop your resume here</div>
          <div className="relative z-10 mt-1.5 text-[13px] text-[var(--text-muted)]">
            PDF or DOCX · or <span className="cursor-pointer text-[var(--accent)] underline">browse files</span>
          </div>
        </Link>

        {/* CTA row */}
        <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-dim)]">Your data stays local. Never shared.</span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-medium text-[#1a1508] transition-all hover:bg-[var(--accent2)] hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 24px rgba(200,169,126,0.25)" }}
          >
            Continue to Dashboard
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <Link
          href="/dashboard"
          className="mt-4 inline-block text-xs text-[var(--text-dim)] underline transition-colors hover:text-[var(--text-muted)]"
        >
          Skip to demo dashboard →
        </Link>
      </div>
    </div>
  );
}
