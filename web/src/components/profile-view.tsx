"use client";

import { PROFILE_DATA } from "@/lib/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const typeLabel: Record<string, string> = { work: "Work", edu: "Education", award: "Award", project: "Project", other: "Activity" };
const obsBorder: Record<string, string> = { strength: "border-l-[var(--candor-green)]", gap: "border-l-[var(--candor-amber)]", tip: "border-l-[var(--candor-blue)]", pattern: "border-l-[var(--candor-purple)]" };

export function ProfileView() {
  const p = PROFILE_DATA;
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-start gap-6">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-[var(--candor-gold)] to-[var(--candor-purple)]" />
        <div>
          <h1 className="font-serif text-2xl font-normal text-[var(--candor-text)]">{p.name}</h1>
          <p className="text-[var(--candor-muted)]">{p.headline}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.skills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-full bg-[var(--candor-surface2)] px-2.5 py-0.5 text-xs text-[var(--candor-muted)]">{s}</span>
            ))}
          </div>
        </div>
      </div>
      <Card className="border-l-4 border-l-[var(--candor-gold)] bg-[var(--candor-surface2)]">
        <CardContent className="pt-6">
          <p className="font-serif italic text-[var(--candor-text)]">{p.narrative}</p>
          <p className="mt-2 text-xs text-[var(--candor-dim)]">AI Narrative · Candor uses this when writing your applications</p>
        </CardContent>
      </Card>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">Career Timeline</h3>
          <div className="space-y-4">
            {p.timeline.map((item, i) => (
              <div key={i} className={cn("flex gap-4", item.highlight && "text-[var(--candor-text)]")}>
                <div className="flex flex-col items-center">
                  <div className={cn("h-2 w-2 rounded-full", item.highlight ? "bg-[var(--candor-gold)]" : "bg-[var(--candor-dim)]")} />
                  {i < p.timeline.length - 1 && <div className="my-0.5 w-px flex-1 bg-[var(--candor-border)]" />}
                </div>
                <div className="pb-4">
                  <span className="text-xs text-[var(--candor-dim)]">{item.year}</span>
                  <span className="ml-2 rounded bg-[var(--candor-surface3)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--candor-muted)]">{typeLabel[item.type] ?? item.type}</span>
                  <p className="mt-1 font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--candor-muted)]">{item.sub}</p>
                  <p className="mt-0.5 text-sm text-[var(--candor-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s} className="rounded-full border border-[var(--candor-border2)] bg-[var(--candor-surface2)] px-3 py-1 text-xs">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">AI Strengths</h3>
            <div className="space-y-3">
              {p.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-[var(--candor-muted)]">{s.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--candor-surface3)]">
                    <div className="h-full rounded-full bg-[var(--candor-green)] transition-all duration-500" style={{ width: `${s.score}%` }} />
                  </div>
                  <span className="text-[11px] text-[var(--candor-dim)]">{s.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">What I&apos;m Looking For</h3>
            <p className="text-sm text-[var(--candor-muted)]">{p.lookingFor}</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--candor-muted)]">AI Observations</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.observations.map((obs, i) => (
            <Card key={i} className={cn("border-l-4 bg-[var(--candor-surface2)]", obsBorder[obs.type] ?? "border-l-[var(--candor-gold)]")}>
              <CardContent className="pt-4">
                <p className="font-medium"><span className="mr-1">{obs.icon}</span>{obs.title}</p>
                <p className="mt-1 text-sm text-[var(--candor-muted)]">{obs.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
