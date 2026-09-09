'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useIndustriesContext } from '@/contexts/IndustriesContext'

const navItems = [
  { name: 'Today', path: '/dashboard' },
  { name: 'Board', path: '/dashboard/board' },
  { name: 'All Jobs', path: '/dashboard/jobs' },
  { name: 'Analytics', path: '/dashboard/analytics' },
  { name: 'My Story', path: '/dashboard/profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showAddIndustry, setShowAddIndustry] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
      if (e.key === 'Escape') {
        setShowQuickAdd(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className="w-60 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-[var(--border)]">
          <h1 className="text-2xl font-serif text-[var(--accent)]">Candor</h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">Authenticity-first</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? 'bg-[var(--surface3)] text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Industry groups placeholder */}
          <div className="mt-8">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Industries
            </h3>
            <p className="text-sm text-[var(--text-dim)]">Coming soon...</p>
          </div>

          {/* Search bar placeholder */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] placeholder-[var(--text-dim)]"
              disabled
            />
          </div>
        </nav>

        {/* Quick Add Button */}
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full py-2 px-4 bg-[var(--accent)] text-[var(--bg)] rounded-md font-medium hover:bg-[var(--accent)]/90 flex items-center justify-center gap-2"
          >
            Quick Add
            <span className="text-xs bg-[var(--bg)]/20 px-1 py-0.5 rounded">⌘K</span>
          </button>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--surface3)] rounded-full flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-sm text-[var(--text)]">
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </p>
            </div>
            <button className="text-[var(--text-muted)] hover:text-[var(--text)]">
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] max-w-md w-full mx-4">
            <h2 className="text-lg font-medium text-[var(--text)] mb-4">Quick Add</h2>
            <QuickAddForm onClose={() => setShowQuickAdd(false)} onAddIndustry={() => { setShowAddIndustry(true); setShowQuickAdd(false) }} />
          </div>
        </div>
      )}
    </>
  )
}

function QuickAddForm({ onClose, onAddIndustry }: { onClose: () => void, onAddIndustry: () => void }) {
  const { industries, addCompany } = useIndustriesContext()
  const [companyName, setCompanyName] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [role, setRole] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName && !jobUrl) return
    if (!selectedIndustry) return

    setLoading(true)
    try {
      await addCompany(selectedIndustry, {
        name: companyName || 'Unknown Company',
        role: role || null,
        location: null,
        salary: null,
        logo_url: null,
        status: 'draft',
        applied_at: null,
        status_changed_at: new Date().toISOString(),
        jd_text: null,
        jd_url: jobUrl || null,
        interview_round: null,
        next_action: null,
        next_action_due: null,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Company Name or Job URL
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
          className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="Or paste job URL"
          className="w-full mt-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Role (Optional)
        </label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Software Engineer"
          className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Industry
        </label>
        {industries.length === 0 ? (
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">No industries yet.</p>
            <button
              type="button"
              onClick={onAddIndustry}
              className="px-3 py-1 bg-[var(--surface2)] border border-[var(--border)] rounded text-sm text-[var(--text)] hover:bg-[var(--surface3)]"
            >
              Add Industry
            </button>
          </div>
        ) : (
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.emoji} {industry.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || (!companyName && !jobUrl) || !selectedIndustry}
          className="flex-1 py-2 px-4 bg-[var(--accent)] text-[var(--bg)] rounded-md font-medium hover:bg-[var(--accent)]/90 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Company'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-md hover:bg-[var(--surface3)]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}