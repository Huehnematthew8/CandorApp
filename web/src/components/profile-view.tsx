"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getInitialsFromName } from "@/lib/utils";
import { getApiUrl, fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import type { ProfileData, ProfileTimelineItem, ProfileStrength, ProfileObservation } from "@/lib/demo-data";

const typeLabel: Record<string, string> = { work: "Work", edu: "Education", award: "Award", project: "Project", other: "Activity" };

/* Theme-matched, muted (same pattern as status dropdown) */
const SKILL_CHIP_COLORS = [
  "border border-[var(--blue)]/30 bg-[var(--blue-dim)] text-[var(--blue)]",
  "border border-[var(--amber)]/30 bg-[var(--amber-dim)] text-[var(--amber)]",
  "border border-[var(--purple)]/30 bg-[var(--purple-dim)] text-[var(--purple)]",
  "border border-[var(--accent)]/30 bg-[var(--accent-glow)] text-[var(--accent)]",
  "border border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]",
];

export function ProfileView() {
  const { token } = useAuth();
  const { profile, setProfile, saveProfile, loading } = useProfile();
  const [saving, setSaving] = useState(false);
  const [resumeStatus, setResumeStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [resumeMessage, setResumeMessage] = useState("");
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [pendingProfileExtract, setPendingProfileExtract] = useState<Partial<ProfileData> | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!token) {
      setResumeStatus("error");
      setResumeMessage("Please sign in to upload a resume.");
      return;
    }
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setResumeStatus("error");
      setResumeMessage("Please use a PDF or DOCX file.");
      return;
    }
    setResumeStatus("uploading");
    setResumeMessage("");
    setPendingProfileExtract(null);
    setShowUpdateProfileModal(false);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetchWithAuth("/api/resume/upload", { method: "POST", body: formData, token });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResumeStatus("error");
        setResumeMessage(data.error || `Upload failed (${res.status})`);
        return;
      }
      setResumeStatus("success");
      setResumeMessage("Resume saved. New uploads replace the previous file.");
      setProfile((prev) => ({ ...prev, resumeUploadedAt: new Date().toISOString() }));
      const extract = data.profileExtract;
      if (extract && typeof extract === "object" && (extract.name != null || extract.narrative != null || (Array.isArray(extract.skills) && extract.skills.length) || (Array.isArray(extract.timeline) && extract.timeline.length))) {
        setPendingProfileExtract(extract);
        setShowUpdateProfileModal(true);
      } else if (!data.profileExtract) {
        setResumeMessage("Resume saved. Add GEMINI_API_KEY to server .env to extract profile from resume.");
      }
    } catch {
      setResumeStatus("error");
      setResumeMessage("Could not reach the server.");
    }
    e.target.value = "";
  };

  const handlePreviewResume = async () => {
    if (!token) return;
    setPreviewLoading(true);
    try {
      const res = await fetchWithAuth("/api/resume/file", { token });
      if (!res.ok) {
        setResumeMessage("No resume on file or failed to load.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setResumeMessage("Could not load resume.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyProfileExtract = async () => {
    if (!pendingProfileExtract) return;
    const next: ProfileData = {
      ...profile,
      name: pendingProfileExtract.name ?? profile.name,
      headline: pendingProfileExtract.headline ?? profile.headline,
      narrative: pendingProfileExtract.narrative ?? profile.narrative,
      lookingFor: pendingProfileExtract.lookingFor ?? profile.lookingFor,
      skills: (pendingProfileExtract.skills?.length ? pendingProfileExtract.skills : profile.skills) as string[],
      timeline: (pendingProfileExtract.timeline?.length ? pendingProfileExtract.timeline : profile.timeline) as ProfileData["timeline"],
      strengths: profile.strengths,
      observations: profile.observations,
    };
    setProfile(next);
    setShowUpdateProfileModal(false);
    setPendingProfileExtract(null);
    setResumeMessage("Profile updated from resume. Click Save profile to keep changes.");
    setSaving(true);
    try {
      await saveProfile(next);
    } finally {
      setSaving(false);
    }
  };

  const dismissProfileModal = () => {
    setShowUpdateProfileModal(false);
    setPendingProfileExtract(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile(profile);
      setIsPreviewMode(true);
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const updateTimeline = (index: number, patch: Partial<ProfileTimelineItem>) => {
    setProfile((prev) => ({
      ...prev,
      timeline: prev.timeline.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  };
  const addTimeline = () => {
    setProfile((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { year: "", endDate: "", type: "work", title: "", sub: "", desc: "", highlight: false }],
    }));
  };
  const removeTimeline = (index: number) => {
    setProfile((prev) => ({ ...prev, timeline: prev.timeline.filter((_, i) => i !== index) }));
  };

  const updateStrength = (index: number, patch: Partial<ProfileStrength>) => {
    setProfile((prev) => ({
      ...prev,
      strengths: prev.strengths.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };
  const addStrength = () => {
    setProfile((prev) => ({ ...prev, strengths: [...prev.strengths, { label: "", score: 0 }] }));
  };
  const removeStrength = (index: number) => {
    setProfile((prev) => ({ ...prev, strengths: prev.strengths.filter((_, i) => i !== index) }));
  };

  const setSkills = (skills: string[]) => update({ skills });
  const addObservation = () => {
    setProfile((prev) => ({
      ...prev,
      observations: [...prev.observations, { type: "tip", icon: "→", title: "", text: "" }],
    }));
  };
  const updateObservation = (index: number, patch: Partial<ProfileObservation>) => {
    setProfile((prev) => ({
      ...prev,
      observations: prev.observations.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  };
  const removeObservation = (index: number) => {
    setProfile((prev) => ({ ...prev, observations: prev.observations.filter((_, i) => i !== index) }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <span className="text-sm text-[var(--text-muted)]">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-xl font-normal text-[var(--candor-text)]">My Story</h1>
        {isPreviewMode ? (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsPreviewMode(false)}>
            Edit profile
          </Button>
        ) : (
          <Button size="sm" className="rounded-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        )}
      </div>
      <p className="text-sm text-[var(--candor-muted)]">
        This page is your shared reference with the AI: keep it updated so tailored emails and applications stay accurate. The AI uses only what you write here (not the raw resume) when writing for you.
      </p>

      {/* Resume */}
      <Card className="border-[var(--candor-border2)] bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">Resume</h3>
          <p className="mb-3 text-sm text-[var(--candor-muted)]">
            Upload a PDF resume (new uploads replace the existing one). AI uses it to tailor emails. You can preview the saved file below.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeUpload}
              className="hidden"
              aria-label="Upload resume"
            />
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={resumeStatus === "uploading"}
              className="rounded-full border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-4 py-2 text-sm font-medium text-[var(--candor-text)] transition-colors hover:bg-[var(--candor-surface)] disabled:opacity-50"
            >
              {resumeStatus === "uploading" ? "Uploading…" : resumeStatus === "success" ? "Saved ✓" : "Upload resume"}
            </button>
            {profile.resumeUploadedAt && (
              <button
                type="button"
                onClick={handlePreviewResume}
                disabled={previewLoading}
                className="rounded-full border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-4 py-2 text-sm font-medium text-[var(--candor-text)] transition-colors hover:bg-[var(--candor-surface)] disabled:opacity-50"
              >
                {previewLoading ? "Opening…" : "Preview resume"}
              </button>
            )}
          </div>
          {resumeMessage && (
            <p className={cn("mt-2 text-sm", resumeStatus === "error" ? "text-[var(--candor-red)]" : "text-[var(--candor-muted)]")}>
              {resumeMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Profile completeness */}
      {(() => {
        const checks = [
          [!!profile.name?.trim(), "Name"],
          [!!profile.headline?.trim(), "Headline"],
          [!!profile.narrative?.trim(), "Narrative"],
          [!!profile.lookingFor?.trim(), "What you're looking for"],
          [(profile.skills?.length ?? 0) > 0, "Skills"],
          [(profile.timeline?.length ?? 0) > 0, "Experience timeline"],
          [!!(profile.workRights?.trim() || profile.basedIn?.trim()), "Work rights / location"],
        ];
        const filled = checks.filter(([ok]) => ok).length;
        const total = checks.length;
        const score = total ? Math.round((filled / total) * 100) : 0;
        const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
        return (
          <Card className="border-[var(--candor-border2)] bg-[var(--candor-surface2)] mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2" title="Profile completeness">
                  <div className="relative h-10 w-10">
                    <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--candor-border2)" strokeWidth="2.5" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--candor-gold)" strokeWidth="2.5" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[var(--candor-text)]">{score}% complete</span>
                </div>
                {missing.length > 0 && (
                  <p className="text-xs text-[var(--candor-muted)]">
                    Missing: {missing.join(", ")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Name & headline */}
      <Card className="border-[var(--candor-border2)] bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-[#1a1508]"
              style={{ background: "linear-gradient(135deg, var(--candor-gold), var(--candor-purple))" }}
              title={`Profile: ${(() => { const c = [[!!profile.name?.trim(), "Name"], [!!profile.headline?.trim(), "Headline"], [!!profile.narrative?.trim(), "Narrative"], [(profile.skills?.length ?? 0) > 0, "Skills"], [(profile.timeline?.length ?? 0) > 0, "Timeline"]]; const f = c.filter(([ok]) => ok).length; return Math.round((f / c.length) * 100) + "%"; })()}`}
            >
              {getInitialsFromName(profile.name)}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {isPreviewMode ? (
                <>
                  {profile.name && <p className="text-lg font-medium text-[var(--candor-text)]">{profile.name}</p>}
                  {profile.headline && <p className="text-sm text-[var(--candor-muted)]">{profile.headline}</p>}
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.filter(Boolean).map((s, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                          SKILL_CHIP_COLORS[i % SKILL_CHIP_COLORS.length]
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Your name"
                    value={profile.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="text-lg font-medium"
                  />
                  <Input
                    placeholder="Headline (e.g. Senior Product Designer · 6 years experience)"
                    value={profile.headline}
                    onChange={(e) => update({ headline: e.target.value })}
                    className="text-[var(--candor-muted)]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {profile.skills.map((s, i) => (
                      <span
                        key={i}
                        className={cn(
                          "group relative inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                          SKILL_CHIP_COLORS[i % SKILL_CHIP_COLORS.length]
                        )}
                      >
                        {s || "(empty)"}
                        <button
                          type="button"
                          onClick={() => setSkills(profile.skills.filter((_, j) => j !== i))}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100"
                          aria-label={`Remove ${s || "skill"}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = newSkillInput.trim();
                            if (v) {
                              setSkills([...profile.skills, v]);
                              setNewSkillInput("");
                            }
                          }
                        }}
                        placeholder="Add a skill"
                        className="w-28 rounded-full border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-2.5 py-1 text-xs placeholder:text-[var(--candor-dim)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = newSkillInput.trim();
                          if (v) {
                            setSkills([...profile.skills, v]);
                            setNewSkillInput("");
                          }
                        }}
                        className="rounded-full border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-2.5 py-1 text-xs text-[var(--candor-muted)] hover:bg-[var(--candor-surface)] hover:text-[var(--candor-text)]"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative */}
      <Card className="border-l-4 border-l-[var(--candor-gold)] bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--candor-muted)]">AI Narrative</h3>
          <p className="mb-2 text-xs text-[var(--candor-dim)]">Candor uses this when writing your applications and tailoring emails.</p>
          {isPreviewMode ? (
            <p className="whitespace-pre-wrap text-sm text-[var(--candor-text)]">{profile.narrative || "—"}</p>
          ) : (
            <textarea
              placeholder="A short narrative about your background and what you bring..."
              value={profile.narrative}
              onChange={(e) => update({ narrative: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
            />
          )}
        </CardContent>
      </Card>

      {/* What I'm looking for */}
      <Card className="bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">What I'm Looking For</h3>
          {isPreviewMode ? (
            <p className="whitespace-pre-wrap text-sm text-[var(--candor-text)]">{profile.lookingFor || "—"}</p>
          ) : (
            <textarea
              placeholder="Ideal role, company size, remote preference..."
              value={profile.lookingFor}
              onChange={(e) => update({ lookingFor: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
            />
          )}
        </CardContent>
      </Card>

      {/* Work rights & location (overseas / visa) */}
      <Card className="bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">Work Rights & Location</h3>
          <p className="mb-3 text-xs text-[var(--candor-dim)]">Used in applications when the role is overseas or requires visa info.</p>
          {isPreviewMode ? (
            <div className="space-y-1 text-sm text-[var(--candor-text)]">
              {profile.workRights && <p><span className="text-[var(--candor-muted)]">Work rights:</span> {profile.workRights}</p>}
              {profile.basedIn && <p><span className="text-[var(--candor-muted)]">Based in:</span> {profile.basedIn}</p>}
              {profile.openToRelocate && <p><span className="text-[var(--candor-muted)]">Open to relocate:</span> {profile.openToRelocate}</p>}
              {profile.targetCountries?.length ? <p><span className="text-[var(--candor-muted)]">Target countries:</span> {profile.targetCountries.join(", ")}</p> : null}
              {!profile.workRights && !profile.basedIn && !profile.openToRelocate && !profile.targetCountries?.length && <p className="text-[var(--candor-dim)]">—</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                placeholder="Work rights / visa (e.g. Australian citizen, UK work permit)"
                value={profile.workRights ?? ""}
                onChange={(e) => update({ workRights: e.target.value })}
                className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-3 py-2 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
              />
              <input
                placeholder="Based in (e.g. Sydney, Australia)"
                value={profile.basedIn ?? ""}
                onChange={(e) => update({ basedIn: e.target.value })}
                className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-3 py-2 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
              />
              <input
                placeholder="Open to relocate (e.g. Yes, Remote only, EU preferred)"
                value={profile.openToRelocate ?? ""}
                onChange={(e) => update({ openToRelocate: e.target.value })}
                className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-3 py-2 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
              />
              <input
                placeholder="Target countries (comma-separated)"
                value={(profile.targetCountries ?? []).join(", ")}
                onChange={(e) => update({ targetCountries: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                className="w-full rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-3 py-2 text-sm text-[var(--candor-text)] placeholder:text-[var(--candor-dim)]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Timeline */}
      <Card className="bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">Career Timeline</h3>
          {isPreviewMode ? (
            <div className="space-y-4">
              {profile.timeline.length === 0 ? (
                <p className="text-sm text-[var(--candor-dim)]">—</p>
              ) : (
                profile.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4 rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-[var(--candor-muted)]">
                        {[item.year, item.endDate].filter(Boolean).join(" – ") || "—"}
                      </span>
                      {i < profile.timeline.length - 1 && <div className="my-1 w-px flex-1 bg-[var(--candor-border)]" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[10px] uppercase text-[var(--candor-dim)]">{typeLabel[item.type] ?? item.type}</span>
                      {item.title && <p className="text-sm font-medium text-[var(--candor-text)]">{item.title}</p>}
                      {item.sub && <p className="text-xs text-[var(--candor-muted)]">{item.sub}</p>}
                      {item.desc && <p className="text-xs text-[var(--candor-dim)]">{item.desc}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {profile.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4 rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3">
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        placeholder="Start (e.g. 2020 or Jan 2020)"
                        value={item.year}
                        onChange={(e) => updateTimeline(i, { year: e.target.value })}
                        className="w-36 rounded border border-[var(--candor-border2)] bg-[var(--candor-surface2)] px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="End (e.g. 2022 or Present)"
                        value={item.endDate ?? ""}
                        onChange={(e) => updateTimeline(i, { endDate: e.target.value || undefined })}
                        className="w-36 rounded border border-[var(--candor-border2)] bg-[var(--candor-surface2)] px-2 py-1 text-xs"
                      />
                      {i < profile.timeline.length - 1 && <div className="my-1 w-px flex-1 bg-[var(--candor-border)]" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <select
                        value={item.type}
                        onChange={(e) => updateTimeline(i, { type: e.target.value })}
                        className="rounded border border-[var(--candor-border2)] bg-[var(--candor-surface2)] px-1.5 py-0.5 text-[10px] uppercase"
                      >
                        {Object.entries(typeLabel).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <Input placeholder="Title" value={item.title} onChange={(e) => updateTimeline(i, { title: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder="Company / institution" value={item.sub} onChange={(e) => updateTimeline(i, { sub: e.target.value })} className="h-8 text-sm" />
                      <Input placeholder="Description" value={item.desc} onChange={(e) => updateTimeline(i, { desc: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <button type="button" onClick={() => removeTimeline(i)} className="shrink-0 text-[var(--candor-red)] hover:underline">Remove</button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={addTimeline}>+ Add entry</Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card className="bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">AI Strengths</h3>
          {isPreviewMode ? (
            <div className="space-y-3">
              {profile.strengths.length === 0 ? (
                <p className="text-sm text-[var(--candor-dim)]">—</p>
              ) : (
                profile.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-[var(--candor-text)]">{s.label || "—"}</span>
                    <span className="w-8 text-xs text-[var(--candor-muted)]">{s.score}%</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--candor-surface3)]">
                      <div className="h-full rounded-full bg-[var(--candor-green)]" style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {profile.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input placeholder="Label" value={s.label} onChange={(e) => updateStrength(i, { label: e.target.value })} className="w-28 text-sm" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.score}
                      onChange={(e) => updateStrength(i, { score: Number(e.target.value) || 0 })}
                      className="w-16 rounded border border-[var(--candor-border2)] bg-[var(--candor-surface3)] px-2 py-1 text-sm"
                    />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--candor-surface3)]">
                      <div className="h-full rounded-full bg-[var(--candor-green)]" style={{ width: `${s.score}%` }} />
                    </div>
                    <button type="button" onClick={() => removeStrength(i)} className="text-[var(--candor-red)] hover:underline">Remove</button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={addStrength}>+ Add strength</Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Observations */}
      <Card className="bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">AI Observations</h3>
          {isPreviewMode ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.observations.length === 0 ? (
                <p className="text-sm text-[var(--candor-dim)]">—</p>
              ) : (
                profile.observations.map((obs, i) => (
                  <div key={i} className="rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3">
                    {obs.title && <p className="mb-1 text-sm font-medium text-[var(--candor-text)]">{obs.title}</p>}
                    <p className="whitespace-pre-wrap text-sm text-[var(--candor-muted)]">{obs.text || "—"}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.observations.map((obs, i) => (
                  <div key={i} className="rounded-lg border border-[var(--candor-border2)] bg-[var(--candor-surface3)] p-3">
                    <Input placeholder="Title" value={obs.title} onChange={(e) => updateObservation(i, { title: e.target.value })} className="mb-2 text-sm" />
                    <textarea
                      placeholder="Text"
                      value={obs.text}
                      onChange={(e) => updateObservation(i, { text: e.target.value })}
                      rows={2}
                      className="w-full rounded border border-[var(--candor-border2)] bg-[var(--candor-surface2)] p-2 text-sm"
                    />
                    <button type="button" onClick={() => removeObservation(i)} className="mt-1 text-xs text-[var(--candor-red)] hover:underline">Remove</button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={addObservation}>+ Add observation</Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal: Update My Story from resume? */}
      {showUpdateProfileModal && pendingProfileExtract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={dismissProfileModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg text-[var(--text)]">Update My Story from resume?</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              We extracted your name, headline, narrative, skills, and experience from the resume. Apply them to your profile? You can edit anything after.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="rounded-full" onClick={applyProfileExtract}>
                Yes, update My Story
              </Button>
              <Button variant="outline" className="rounded-full" onClick={dismissProfileModal}>
                No thanks
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
