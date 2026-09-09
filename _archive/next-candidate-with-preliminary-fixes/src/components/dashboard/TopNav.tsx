'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import WombatMascot from '@/components/ui/WombatMascot';

interface TopNavProps {
  onAddJob: () => void;
  onAddGroup?: () => void;
  onImportUrl?: (url: string) => Promise<void>;
  onBulkImport?: () => void;
  importing?: boolean;
  groupCount?: number;
}

export default function TopNav({ onAddJob }: TopNavProps) {
  const selectJob = useAppStore((s) => s.selectJob);
  return (
    <header className="candor-nav">
      <a href="/dashboard" className="candor-brand" aria-label="Candor applications">
        <WombatMascot size={34} />
        <span>Candor</span>
      </a>
      <nav aria-label="Main navigation" className="candor-nav-links">
        <button className="btn-ghost" onClick={() => selectJob(null)}>Applications</button>
        <Link className="btn-ghost" href="/story">Evidence library</Link>
        <Link className="btn-ghost" href="/settings">Backups</Link>
      </nav>
      <button className="btn-gold" onClick={onAddJob}>+ Add role</button>
      <style jsx>{`
        .candor-nav { display:flex; align-items:center; gap:16px; padding:12px 24px; background:var(--s1); border-bottom:1px solid var(--b1); flex-shrink:0; flex-wrap:wrap; }
        .candor-brand { display:flex; align-items:center; gap:6px; color:var(--t1); font-size:20px; font-weight:800; letter-spacing:-.04em; text-decoration:none; }
        .candor-nav-links { display:flex; align-items:center; gap:8px; flex:1; flex-wrap:wrap; }
        .candor-nav :global(a.btn-ghost) { text-decoration:none; }
        .candor-nav :global(:focus-visible) { outline:3px solid var(--gold); outline-offset:3px; }
        @media(max-width:600px) { .candor-nav { padding:12px; gap:10px; } .candor-nav-links { order:3; flex-basis:100%; } .candor-nav > button { margin-left:auto; } }
      `}</style>
    </header>
  );
}
