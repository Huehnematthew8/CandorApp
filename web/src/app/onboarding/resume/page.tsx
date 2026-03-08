"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { hasCompletedResumeOnboarding, setResumeOnboardingDone } from "@/lib/onboarding";
import { ResumeDropZone } from "@/components/resume-drop-zone";

export default function OnboardingResumePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (hasCompletedResumeOnboarding()) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSuccess = () => {
    setResumeOnboardingDone();
    router.push("/dashboard");
    router.refresh();
  };

  if (isLoading || !isAuthenticated || hasCompletedResumeOnboarding()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <span className="text-sm text-[var(--text-muted)]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
        />
        <span className="font-serif text-xl text-[var(--text)]">Candor</span>
      </div>
      <h1 className="mb-2 font-serif text-2xl font-normal text-[var(--text)]">Add your resume</h1>
      <p className="mb-8 max-w-[420px] text-center text-[15px] text-[var(--text-muted)]">
        We’ll use it to tailor your applications. You can upload a new version anytime in My Story.
      </p>
      <div className="w-full max-w-[520px]">
        <ResumeDropZone
          onSuccess={handleSuccess}
          successMessage="Resume uploaded. Taking you to dashboard…"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setResumeOnboardingDone();
          router.push("/dashboard");
          router.refresh();
        }}
        className="mt-6 text-sm text-[var(--text-dim)] underline hover:text-[var(--text-muted)]"
      >
        Skip for now →
      </button>
    </div>
  );
}
