'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import TopNav from '@/components/dashboard/TopNav';
import TableView from '@/components/dashboard/TableView';
import DetailView from '@/components/dashboard/DetailView';
import AddJobModal from '@/components/dashboard/modals/AddJobModal';
import AddStageModal from '@/components/dashboard/modals/AddStageModal';
import LogInteractionModal from '@/components/dashboard/modals/LogInteractionModal';
import AddGroupModal from '@/components/dashboard/modals/AddGroupModal';
import BulkImportModal from '@/components/dashboard/modals/BulkImportModal';
import WombatMascot from '@/components/ui/WombatMascot';

function DashboardContent() {
  const { loading, error, selectedJobId, getJob, loadAllData, groups } = useAppStore();
  const { toast } = useToast();

  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedPrefill, setImportedPrefill] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (error) toast(error);
  }, [error, toast]);

  const selectedJob = selectedJobId ? getJob(selectedJobId) : undefined;
  const realGroups = groups.filter((g) => g.id !== '__ungrouped');

  async function handleImportUrl(url: string) {
    setImporting(true);
    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.company || data.role) {
        setImportedPrefill({ ...data, url });
        setShowAddJob(true);
        toast('Job details imported — review and save');
      } else {
        setImportedPrefill({ url });
        setShowAddJob(true);
        toast("Couldn't fetch that URL — fill in details manually");
      }
    } catch {
      setImportedPrefill(null);
      setShowAddJob(true);
      toast("Couldn't fetch that URL — fill in details manually");
    }
    setImporting(false);
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
        background: 'var(--bg)',
        animation: 'fade .3s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '4px' }}>
          <WombatMascot size={42} style={{ marginRight: '-4px' }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)' }}>Candor</span>
        </div>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', animation: 'spin .8s linear infinite' }} />
        <p style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 300 }}>Loading your applications…</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      <TopNav
        onAddJob={() => setShowAddJob(true)}
        onAddGroup={() => setShowAddGroup(true)}
        onImportUrl={handleImportUrl}
        onBulkImport={() => setShowBulkImport(true)}
        importing={importing}
        groupCount={realGroups.length}
      />

      {selectedJob ? (
        <DetailView
          job={selectedJob}
          onLogInteraction={() => setShowLogInteraction(true)}
        />
      ) : (
        <TableView onAddGroup={() => setShowAddGroup(true)} />
      )}

      {showAddJob && (
        <AddJobModal
          onClose={() => { setShowAddJob(false); setImportedPrefill(null); }}
          prefill={importedPrefill}
        />
      )}

      {showAddStage && selectedJob && (
        <AddStageModal
          jobId={selectedJob.id}
          onClose={() => setShowAddStage(false)}
        />
      )}

      {showLogInteraction && selectedJob && (
        <LogInteractionModal
          jobId={selectedJob.id}
          onClose={() => setShowLogInteraction(false)}
        />
      )}

      {showAddGroup && (
        <AddGroupModal onClose={() => setShowAddGroup(false)} />
      )}

      {showBulkImport && (
        <BulkImportModal onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
