'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import WombatMascot from '@/components/ui/WombatMascot';

interface TimelineEntry {
  year: string;
  role: string;
  company: string;
  detail: string;
}

interface SkillEntry {
  name: string;
  level: number;
}

interface StrengthEntry {
  title: string;
  desc: string;
}

interface StoryData {
  name: string;
  title: string;
  location: string;
  narrative: string;
  lookingFor: string;
  timeline: TimelineEntry[];
  skills: SkillEntry[];
  strengths: StrengthEntry[];
  observations: string[];
}

const EMPTY_STORY: StoryData = {
  name: '',
  title: '',
  location: '',
  narrative: '',
  lookingFor: '',
  timeline: [],
  skills: [],
  strengths: [],
  observations: [],
};

const TIMELINE_COLORS = ['var(--gold)', 'var(--blue)', 'var(--teal)', 'var(--purple)', 'var(--amber)', 'var(--green)'];

function dbRowToStory(row: Record<string, unknown>): StoryData {
  return {
    name: (row.name as string) || '',
    title: (row.title as string) || '',
    location: (row.location as string) || '',
    narrative: (row.narrative as string) || '',
    lookingFor: (row.looking_for as string) || '',
    timeline: (row.timeline as TimelineEntry[]) || [],
    skills: (row.skills as SkillEntry[]) || [],
    strengths: (row.strengths as StrengthEntry[]) || [],
    observations: (row.observations as string[]) || [],
  };
}

export default function StoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [story, setStory] = useState<StoryData>(EMPTY_STORY);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(true);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [editingTimeline, setEditingTimeline] = useState<number | null>(null);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [editingStrength, setEditingStrength] = useState<number | null>(null);
  const [editingObs, setEditingObs] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      userIdRef.current = uid;
      if (!uid) { setLoaded(true); return; }
      supabase.from('profiles').select('*').eq('user_id', uid).single().then(({ data: row }) => {
        if (row) setStory(dbRowToStory(row as Record<string, unknown>));
        setLoaded(true);
      });
    });
  }, []);

  const persist = useCallback((updated: StoryData) => {
    setStory(updated);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const uid = userIdRef.current;
      if (!uid) { setSaved(true); return; }
      const supabase = createClient();
      await supabase.from('profiles').upsert({
        user_id: uid,
        name: updated.name,
        title: updated.title,
        location: updated.location,
        narrative: updated.narrative,
        looking_for: updated.lookingFor,
        timeline: updated.timeline,
        skills: updated.skills,
        strengths: updated.strengths,
        observations: updated.observations,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      setSaved(true);
    }, 600);
  }, []);

  function update<K extends keyof StoryData>(key: K, value: StoryData[K]) {
    persist({ ...story, [key]: value });
  }

  function hasContent(): boolean {
    return !!(story.name || story.narrative || story.timeline.length || story.skills.length);
  }

  async function parseAndApply(resumeText: string) {
    setUploading(true);
    try {
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Parse failed');
      }
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);

      const merged: StoryData = {
        name: parsed.name || story.name || '',
        title: parsed.title || story.title || '',
        location: parsed.location || story.location || '',
        narrative: parsed.narrative || story.narrative || '',
        lookingFor: parsed.lookingFor || story.lookingFor || '',
        timeline: (parsed.timeline?.length > 0) ? parsed.timeline : story.timeline,
        skills: (parsed.skills?.length > 0) ? parsed.skills : story.skills,
        strengths: (parsed.strengths?.length > 0) ? parsed.strengths : story.strengths,
        observations: (parsed.observations?.length > 0) ? parsed.observations : story.observations,
      };

      persist(merged);
      toast('Profile filled from resume ✓');
      setShowPaste(false);
      setPasteText('');
    } catch (err) {
      toast('Could not parse resume — ' + (err as Error).message);
    }
    setUploading(false);
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (ext === '.pdf') {
      // Send PDF as FormData for server-side text extraction
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/ai/parse-resume', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || 'Parse failed');
        }
        const parsed = await res.json();
        if (parsed.error) throw new Error(parsed.error);
        const merged = {
          name: parsed.name || story.name || '',
          title: parsed.title || story.title || '',
          location: parsed.location || story.location || '',
          narrative: parsed.narrative || story.narrative || '',
          lookingFor: parsed.lookingFor || story.lookingFor || '',
          timeline: (parsed.timeline?.length > 0) ? parsed.timeline : story.timeline,
          skills: (parsed.skills?.length > 0) ? parsed.skills : story.skills,
          strengths: (parsed.strengths?.length > 0) ? parsed.strengths : story.strengths,
          observations: (parsed.observations?.length > 0) ? parsed.observations : story.observations,
        };
        persist(merged);
        toast('Profile filled from resume ✓');
      } catch (err) {
        toast('Could not parse PDF — ' + (err as Error).message);
      }
      setUploading(false);
      return;
    }

    if (!['.txt', '.md'].includes(ext)) {
      toast('Please upload a .pdf, .txt, or .md file');
      return;
    }

    const text = await file.text();
    if (!text.trim()) { toast('File appears to be empty'); return; }
    await parseAndApply(text);
  }

  function addTimelineEntry() {
    const updated = [...story.timeline, { year: new Date().getFullYear().toString(), role: '', company: '', detail: '' }];
    update('timeline', updated);
    setEditingTimeline(updated.length - 1);
  }

  function removeTimelineEntry(idx: number) {
    update('timeline', story.timeline.filter((_, i) => i !== idx));
    setEditingTimeline(null);
  }

  function updateTimeline(idx: number, field: keyof TimelineEntry, value: string) {
    const updated = story.timeline.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    update('timeline', updated);
  }

  function addSkill() {
    const updated = [...story.skills, { name: '', level: 70 }];
    update('skills', updated);
    setEditingSkill(updated.length - 1);
  }

  function removeSkill(idx: number) {
    update('skills', story.skills.filter((_, i) => i !== idx));
    setEditingSkill(null);
  }

  function updateSkill(idx: number, field: keyof SkillEntry, value: string | number) {
    const updated = story.skills.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    update('skills', updated);
  }

  function addStrength() {
    const updated = [...story.strengths, { title: '', desc: '' }];
    update('strengths', updated);
    setEditingStrength(updated.length - 1);
  }

  function removeStrength(idx: number) {
    update('strengths', story.strengths.filter((_, i) => i !== idx));
    setEditingStrength(null);
  }

  function updateStrength(idx: number, field: keyof StrengthEntry, value: string) {
    const updated = story.strengths.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    update('strengths', updated);
  }

  function addObservation() {
    const updated = [...story.observations, ''];
    update('observations', updated);
    setEditingObs(updated.length - 1);
  }

  function removeObservation(idx: number) {
    update('observations', story.observations.filter((_, i) => i !== idx));
    setEditingObs(null);
  }

  function updateObservation(idx: number, value: string) {
    const updated = story.observations.map((o, i) => i === idx ? value : o);
    update('observations', updated);
  }

  const initials = story.name
    ? story.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (!loaded) return (
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
      <p style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 300 }}>Loading your story…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        height: '52px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '12px',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 20,
      }}>
        <a onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0px', cursor: 'pointer', textDecoration: 'none' }}>
          <WombatMascot size={42} style={{ marginRight: '-4px' }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)' }}>Candor</span>
        </a>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>/</span>
        <span style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 500 }}>My Story</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: saved ? 'var(--t3)' : 'var(--gold)', transition: 'color .3s' }}>
            {saved ? 'Saved' : 'Saving...'}
          </span>
          <div style={{ width: '1px', height: '16px', background: 'var(--b1)' }} />
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px',
              borderRadius: '7px', border: '1px solid var(--b1)', background: 'transparent',
              color: 'var(--t2)', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = 'var(--t1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)'; }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
            Dashboard
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header with profile + upload */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', animation: 'up .25s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 700, color: '#ffffff', flexShrink: 0,
              boxShadow: '0 4px 20px rgba(201,170,126,.25)',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={story.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your name"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', letterSpacing: '-.02em',
                  background: 'none', border: 'none', color: 'var(--t1)', outline: 'none', width: '100%',
                  padding: 0, marginBottom: '2px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={story.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Job title"
                  style={{
                    fontSize: '13px', color: 'var(--t2)', background: 'none', border: 'none',
                    outline: 'none', padding: 0, width: 'auto', minWidth: '80px', maxWidth: '200px',
                  }}
                />
                <span style={{ color: 'var(--t3)', fontSize: '13px' }}>·</span>
                <input
                  value={story.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Location"
                  style={{
                    fontSize: '13px', color: 'var(--t2)', background: 'none', border: 'none',
                    outline: 'none', padding: 0, width: 'auto', minWidth: '80px', maxWidth: '200px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Resume upload */}
          <div style={{ flexShrink: 0, marginTop: '8px' }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={handleResumeUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                  borderRadius: '7px', border: '1px solid var(--b1)', background: 'transparent',
                  color: 'var(--t3)', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  transition: 'all .15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,170,126,.25)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--glow2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {uploading ? (
                  <><span style={{ width: 10, height: 10, border: '1.5px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />Analysing…</>
                ) : (
                  <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>{hasContent() ? 'Fill from resume' : 'Import resume'}</>
                )}
              </button>
              <button
                onClick={() => setShowPaste(!showPaste)}
                style={{ fontSize: '10px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}
              >
                {showPaste ? 'Cancel' : 'Paste text'}
              </button>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '4px' }}>
              .pdf, .txt, or .md — or paste text below
            </div>
            {showPaste && (
              <div style={{ marginTop: '10px', animation: 'up .15s ease both' }}>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your resume text here (copy from PDF, Word, etc.)…"
                  rows={6}
                  className="input-field"
                  style={{ resize: 'vertical', fontSize: '11px', lineHeight: 1.5 }}
                />
                <button
                  className="btn-gold"
                  onClick={() => pasteText.trim() && parseAndApply(pasteText)}
                  disabled={uploading || !pasteText.trim()}
                  style={{ marginTop: '6px', fontSize: '11px', opacity: pasteText.trim() ? 1 : 0.5 }}
                >
                  {uploading ? 'Analysing…' : 'Analyse resume'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Purpose note */}
        <div style={{
          padding: '10px 14px', borderRadius: '8px', background: 'var(--s1)', border: '1px solid var(--b1)',
          fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6, marginBottom: '24px',
          animation: 'up .25s ease both', animationDelay: '.03s',
        }}>
          This is your reference point. Everything here helps Candor's AI write more authentic, personalised content for your applications — and gives you a clear picture of your own story to draw from.
        </div>

        {/* Narrative */}
        <Section label="Your narrative" delay=".05s">
          <div style={{ background: 'var(--glow2)', border: '1px solid rgba(201,170,126,.14)', borderRadius: '12px', padding: '18px 20px' }}>
            <textarea
              value={story.narrative}
              onChange={(e) => update('narrative', e.target.value)}
              placeholder="Write a 2-3 sentence summary of who you are professionally. What drives you? What's your approach?"
              style={{
                width: '100%', fontSize: '15px', lineHeight: 1.75, color: 'var(--t1)',
                fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'none', border: 'none',
                outline: 'none', resize: 'none', minHeight: '80px',
              }}
              rows={3}
            />
          </div>
        </Section>

        {/* Looking for */}
        <Section label="What I'm looking for" delay=".08s">
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '10px', padding: '14px 16px' }}>
            <textarea
              value={story.lookingFor}
              onChange={(e) => update('lookingFor', e.target.value)}
              placeholder="What kind of role, company, or environment are you looking for?"
              style={{
                width: '100%', fontSize: '13px', lineHeight: 1.7, color: 'var(--t2)',
                fontStyle: 'italic', background: 'none', border: 'none', outline: 'none',
                resize: 'none', minHeight: '50px',
              }}
              rows={2}
            />
          </div>
        </Section>

        {/* Timeline */}
        <Section label="Timeline" delay=".1s" onAdd={addTimelineEntry} addLabel="Add role">
          {story.timeline.length === 0 ? (
            <EmptyState text="Add your career history" action="Add first role" onAction={addTimelineEntry} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: '24px' }}>
              <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '1px', background: 'var(--b1)' }} />
              {story.timeline.map((item, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: i < story.timeline.length - 1 ? '16px' : 0 }}>
                  <div style={{ position: 'absolute', left: '-20px', top: '6px', width: '9px', height: '9px', borderRadius: '50%', background: TIMELINE_COLORS[i % TIMELINE_COLORS.length], border: '2px solid var(--bg)', zIndex: 1 }} />
                  {editingTimeline === i ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'var(--s1)', border: '1px solid var(--b2)', animation: 'up .15s ease both' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={item.year} onChange={(e) => updateTimeline(i, 'year', e.target.value)} placeholder="Year" className="input-field" style={{ width: '70px' }} />
                        <input value={item.role} onChange={(e) => updateTimeline(i, 'role', e.target.value)} placeholder="Job title" className="input-field" style={{ flex: 1 }} autoFocus />
                      </div>
                      <input value={item.company} onChange={(e) => updateTimeline(i, 'company', e.target.value)} placeholder="Company" className="input-field" />
                      <input value={item.detail} onChange={(e) => updateTimeline(i, 'detail', e.target.value)} placeholder="Key achievement or responsibility" className="input-field" />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" onClick={() => removeTimelineEntry(i)} style={{ padding: '4px 10px', fontSize: '10px', color: 'var(--red)' }}>Remove</button>
                        <button className="btn-ghost" onClick={() => setEditingTimeline(null)} style={{ padding: '4px 10px', fontSize: '10px' }}>Done</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingTimeline(i)}
                      style={{ cursor: 'pointer', transition: 'all .12s ease', padding: '4px 8px', borderRadius: '6px', marginLeft: '-8px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500, flexShrink: 0 }}>{item.year}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)' }}>{item.role || 'Untitled role'}</span>
                        {item.company && <span style={{ fontSize: '11px', color: 'var(--t3)' }}>at {item.company}</span>}
                      </div>
                      {item.detail && <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{item.detail}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Skills */}
        <Section label="Skills" delay=".14s" onAdd={addSkill} addLabel="Add skill">
          {story.skills.length === 0 ? (
            <EmptyState text="Add your key skills" action="Add first skill" onAction={addSkill} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {story.skills.map((skill, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--s1)', border: '1px solid var(--b1)', transition: 'all .12s ease', cursor: 'pointer' }}
                  onClick={() => setEditingSkill(editingSkill === i ? null : i)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; }}
                >
                  {editingSkill === i ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      <input value={skill.name} onChange={(e) => updateSkill(i, 'name', e.target.value)} placeholder="Skill name" className="input-field" style={{ padding: '5px 8px', fontSize: '12px' }} autoFocus />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="range" min="30" max="95" value={skill.level} onChange={(e) => updateSkill(i, 'level', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--gold)' }} />
                        <span style={{ fontSize: '10px', color: 'var(--t3)', width: '28px', textAlign: 'right' }}>{skill.level}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" onClick={() => removeSkill(i)} style={{ padding: '3px 8px', fontSize: '9px', color: 'var(--red)' }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '12px', fontWeight: 500, flex: 1 }}>{skill.name || 'Unnamed'}</span>
                      <div style={{ width: '80px', height: '3px', borderRadius: '2px', background: 'var(--b1)', overflow: 'hidden' }}>
                        <div style={{ width: `${skill.level}%`, height: '100%', borderRadius: '2px', background: skill.level >= 85 ? 'var(--gold)' : skill.level >= 70 ? 'var(--teal)' : 'var(--t3)', transition: 'width .3s ease' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--t3)', width: '28px', textAlign: 'right' }}>{skill.level}%</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Strengths */}
        <Section label="Strengths" delay=".18s" onAdd={addStrength} addLabel="Add strength">
          {story.strengths.length === 0 ? (
            <EmptyState text="Highlight your key strengths" action="Add first strength" onAction={addStrength} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {story.strengths.map((s, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'var(--s1)', border: '1px solid var(--b1)', cursor: 'pointer', transition: 'all .12s ease' }}
                  onClick={() => setEditingStrength(editingStrength === i ? null : i)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; }}
                >
                  {editingStrength === i ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <input value={s.title} onChange={(e) => updateStrength(i, 'title', e.target.value)} placeholder="Strength name" className="input-field" style={{ padding: '5px 8px', fontSize: '12px', fontWeight: 600 }} autoFocus />
                      <textarea value={s.desc} onChange={(e) => updateStrength(i, 'desc', e.target.value)} placeholder="Why is this a strength?" className="input-field" style={{ padding: '5px 8px', fontSize: '11px', resize: 'none', minHeight: '48px' }} />
                      <button className="btn-ghost" onClick={() => removeStrength(i)} style={{ padding: '3px 8px', fontSize: '9px', color: 'var(--red)', alignSelf: 'flex-end' }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--t1)' }}>{s.title || 'Untitled'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.55 }}>{s.desc || 'Click to add description'}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Observations & Notes */}
        <Section label="Notes & observations" delay=".22s" onAdd={addObservation} addLabel="Add note">
          {story.observations.length === 0 ? (
            <EmptyState text="Jot down career observations, interview tips, or reminders" action="Add first note" onAction={addObservation} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {story.observations.map((obs, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '8px', background: 'var(--s1)', border: '1px solid var(--b1)', cursor: 'pointer', transition: 'all .12s ease' }}
                  onClick={() => setEditingObs(editingObs === i ? null : i)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; }}
                >
                  <div style={{ width: '4px', borderRadius: '2px', background: 'var(--gold)', flexShrink: 0 }} />
                  {editingObs === i ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <textarea value={obs} onChange={(e) => updateObservation(i, e.target.value)} className="input-field" style={{ padding: '5px 8px', fontSize: '12px', resize: 'none', minHeight: '40px' }} autoFocus />
                      <button className="btn-ghost" onClick={() => removeObservation(i)} style={{ padding: '3px 8px', fontSize: '9px', color: 'var(--red)', alignSelf: 'flex-end' }}>Remove</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6, flex: 1 }}>{obs || 'Click to edit'}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ label, delay, children, onAdd, addLabel }: {
  label: string;
  delay: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <section style={{ marginBottom: '28px', animation: 'up .3s ease both', animationDelay: delay }}>
      <div style={{
        fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
        color: 'var(--t3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {label}
        <div style={{ flex: 1, height: '1px', background: 'var(--b1)' }} />
        {onAdd && (
          <button
            onClick={onAdd}
            style={{
              fontSize: '9px', fontWeight: 700, color: 'var(--gold)', background: 'none',
              border: 'none', cursor: 'pointer', letterSpacing: 0, transition: 'all .15s ease',
              padding: '2px 6px', borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glow2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            + {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div
      onClick={onAction}
      style={{
        border: '1.5px dashed var(--b2)', borderRadius: '10px', padding: '24px',
        textAlign: 'center', cursor: 'pointer', transition: 'all .15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.background = 'var(--s1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>{text}</div>
      <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{action} →</div>
    </div>
  );
}
