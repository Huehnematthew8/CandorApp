"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import type { ProfileData } from "@/lib/demo-data";
import { DEFAULT_PROFILE } from "@/lib/demo-data";

function mergeProfile(data: unknown): ProfileData {
  if (!data || typeof data !== "object") return { ...DEFAULT_PROFILE };
  const o = data as Record<string, unknown>;
  return {
    name: typeof o.name === "string" ? o.name : DEFAULT_PROFILE.name,
    headline: typeof o.headline === "string" ? o.headline : DEFAULT_PROFILE.headline,
    narrative: typeof o.narrative === "string" ? o.narrative : DEFAULT_PROFILE.narrative,
    lookingFor: typeof o.lookingFor === "string" ? o.lookingFor : DEFAULT_PROFILE.lookingFor,
    skills: Array.isArray(o.skills) ? o.skills.filter((s): s is string => typeof s === "string") : DEFAULT_PROFILE.skills,
    timeline: Array.isArray(o.timeline)
      ? o.timeline.map((t) =>
          t && typeof t === "object"
            ? {
                year: String((t as Record<string, unknown>).year ?? ""),
                type: String((t as Record<string, unknown>).type ?? "work"),
                title: String((t as Record<string, unknown>).title ?? ""),
                sub: String((t as Record<string, unknown>).sub ?? ""),
                desc: String((t as Record<string, unknown>).desc ?? ""),
                highlight: Boolean((t as Record<string, unknown>).highlight),
              }
            : { year: "", type: "work", title: "", sub: "", desc: "", highlight: false }
        )
      : DEFAULT_PROFILE.timeline,
    strengths: Array.isArray(o.strengths)
      ? o.strengths.map((s) =>
          s && typeof s === "object"
            ? { label: String((s as Record<string, unknown>).label ?? ""), score: Number((s as Record<string, unknown>).score) || 0 }
            : { label: "", score: 0 }
        )
      : DEFAULT_PROFILE.strengths,
    observations: Array.isArray(o.observations)
      ? o.observations.map((obs) =>
          obs && typeof obs === "object"
            ? {
                type: String((obs as Record<string, unknown>).type ?? ""),
                icon: String((obs as Record<string, unknown>).icon ?? ""),
                title: String((obs as Record<string, unknown>).title ?? ""),
                text: String((obs as Record<string, unknown>).text ?? ""),
              }
            : { type: "", icon: "", title: "", text: "" }
        )
      : DEFAULT_PROFILE.observations,
  };
}

type ProfileContextValue = {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saveProfile: (p: ProfileData) => Promise<void>;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth("/api/profile", { token })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setProfile(mergeProfile(data));
      })
      .catch(() => {
        if (!cancelled) setProfile(DEFAULT_PROFILE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const saveProfile = useCallback(
    async (p: ProfileData) => {
      if (!token) return;
      const res = await fetchWithAuth("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
        token,
      });
      if (res.ok) setProfile(p);
    },
    [token]
  );

  return (
    <ProfileContext.Provider value={{ profile, setProfile, saveProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
