'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusSequence } from '@/components/ui/StatusBadge';
import OverviewTab from '@/components/dashboard/overview/OverviewTab';
import ActivityTab from '@/components/dashboard/activity/ActivityTab';
import CommunicationMenu from '@/components/dashboard/activity/CommunicationMenu';
import EmojiPicker from '@/components/ui/EmojiPicker';
import type { Job, CommunicationType } from '@/types';

interface DetailViewProps {
  job: Job;
  onLogInteraction: () => void;
}

export default function DetailView({ job, onLogInteraction }: DetailViewProps) {
  const { selectJob, updateJobStatus, updateJobSalary, updateJob, groups } = useAppStore();
  const [activeTab, setActiveTab] = useState<'ov' | 'act'>('ov');
  const [salaryVal, setSalaryVal] = useState(job.salary || '');
  const [commMode, setCommMode] = useState<CommunicationType | null>(null);

  const group = groups.find((g) => g.id === job.group_id);

  function handleSalaryChange(v: string) {
    setSalaryVal(v);
    updateJobSalary(job.id, v);
  }

  function handleLogoChange(emoji: string) {
    updateJob(job.id, { logo: emoji });
  }

  function handleCommSelect(type: CommunicationType) {
    setCommMode(type);
    setActiveTab('act');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'visible', animation: 'slidein .2s ease both' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px', borderBottom: '1px solid var(--b1)', flexShrink: 0, background: 'var(--bg)' }}>
        <button className="btn-ghost" onClick={() => selectJob(null)} style={{ padding: '4px 10px', borderRadius: '6px' }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
          Applications
        </button>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>/</span>
        <span style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 500 }}>
          {job.company}
          {group && group.id !== '__ungrouped' && (
            <span style={{ color: 'var(--t3)', fontWeight: 400 }}> · {group.emoji} {group.name}</span>
          )}
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
          <EmojiPicker
            value={job.logo || '🏢'}
            onChange={handleLogoChange}
            triggerStyle={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--s2)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            triggerHoverStyle={{
              borderColor: 'var(--gold)',
              background: 'var(--s3)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', letterSpacing: '-.015em', marginBottom: '3px' }}>
              {job.company}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--t2)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
              <span>{job.role}</span>
              <span style={{ color: 'var(--t3)' }}>·</span>
              <span style={{ color: 'var(--t3)' }}>{job.location || 'Remote'}</span>
              <span style={{ color: 'var(--t3)' }}>·</span>
              <input
                value={salaryVal}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="Add salary"
                className="input-field"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px dashed var(--b3)',
                  borderRadius: 0,
                  color: 'var(--gold)',
                  fontSize: '12px',
                  width: '110px',
                  padding: '0 2px',
                  boxShadow: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start' }}>
            <CommunicationMenu onSelect={handleCommSelect} />
            <button className="btn-ghost" onClick={onLogInteraction}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
              Log
            </button>
          </div>
        </div>

        {/* Status sequence */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--b1)', padding: '8px 24px', flexShrink: 0 }}>
          <StatusSequence status={job.status} onChange={(s) => updateJobStatus(job.id, s)} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        {(['ov', 'act'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'ov') setCommMode(null); }}
              style={{
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--t1)' : 'var(--t3)',
                cursor: 'pointer',
                transition: 'all .15s ease',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
                background: 'none',
                border: 'none',
                borderBottom: 'none',
                borderBlockEnd: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--t1)';
                  e.currentTarget.style.borderBlockEnd = '2px solid var(--b3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--t3)';
                  e.currentTarget.style.borderBlockEnd = '2px solid transparent';
                }
              }}
            >
              {tab === 'ov' ? 'Overview' : 'Activity'}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'ov' ? (
          <OverviewTab job={job} onSwitchToActivity={() => { setActiveTab('act'); setCommMode('email'); }} />
        ) : (
          <ActivityTab job={job} onLogInteraction={onLogInteraction} initialMode={commMode} />
        )}
      </div>
    </div>
  );
}

