export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-serif text-[var(--accent)] mb-6">
          Candor
        </h1>
        <p className="text-xl md:text-2xl text-[var(--text)] mb-4">
          Apply authentically at scale
        </p>
        <p className="text-lg text-[var(--text-muted)] mb-12 max-w-2xl mx-auto">
          Stop wasting time on generic applications. Use AI to handle the logistics while you bring your real personality. Recruiters will notice the difference.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            className="px-8 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-md font-medium text-lg hover:bg-[var(--accent)]/90 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="px-8 py-3 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-md font-medium text-lg hover:bg-[var(--surface3)] transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    </div>
  )
}