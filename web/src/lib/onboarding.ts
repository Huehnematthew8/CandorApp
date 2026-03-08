export const RESUME_DONE_KEY = "candor_resume_done";

export function hasCompletedResumeOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RESUME_DONE_KEY) === "true";
}

export function setResumeOnboardingDone(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(RESUME_DONE_KEY, "true");
  }
}
