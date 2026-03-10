const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Optional: Google Gemini (free tier, no credit card) - used when GEMINI_API_KEY is set
let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenAI } = require("@google/genai");
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    console.warn("Gemini SDK not available:", e.message);
  }
}

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

async function generateWithGemini(prompt) {
  if (!geminiClient) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await geminiClient.models.generateContent({
        model,
        contents: prompt,
      });
      const text = response?.text;
      if (typeof text === "string" && text.length > 0) return text;
      const candidates = response?.candidates;
      if (Array.isArray(candidates) && candidates[0]?.content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.warn(`Gemini ${model} failed:`, e.message);
    }
  }
  return null;
}

async function generateWithAnthropic(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { content } = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const block = content.find((c) => c.type === "text");
  return block ? block.text : null;
}

async function generate(prompt) {
  let lastError = null;
  const fromGemini = await generateWithGemini(prompt).catch((e) => {
    lastError = e;
    console.warn("Gemini generate failed:", e.message);
    return null;
  });
  if (fromGemini != null) return fromGemini;
  const fromAnthropic = await generateWithAnthropic(prompt).catch((e) => {
    lastError = e;
    console.warn("Anthropic generate failed:", e.message);
    return null;
  });
  if (fromAnthropic != null) return fromAnthropic;
  console.error("AI returned no response. Last error:", lastError?.message || "none");
  return null;
}

// Given an activity feed (emails + calls/meetings/messages) and current status, suggest next status + reason
async function classifyEmailThreadWithAI(thread, currentStatus) {
  const safeThread = Array.isArray(thread) ? thread : [];
  const trimmed = safeThread.slice(0, 25); // cap size
  const prompt = `You help update a job application tracker from communication and activity history.

Current pipeline status: ${currentStatus || "unknown"}.

You are given an array of touchpoints (chronological, most recent last). Each item is either:
- An email: has direction ("sent" | "received"), subject, body, sentAt or receivedAt (ISO string).
- An activity: has kind "activity", activityType ("call" | "meeting" | "message" | "other"), title, notes (optional), occurredAt (ISO string).

Use both emails and activities (e.g. "Recruiter screen" call, "Technical round 1" meeting) to infer progress.

Decide:
- nextStatus: one of ["draft","applied","screening","round1","round2","offer","rejected"] or null if you cannot infer
- reason: short human explanation (1–2 sentences).

Return ONLY JSON, no markdown, as:
{ "nextStatus": string | null, "reason": string }

Activity feed JSON:
${JSON.stringify(trimmed).slice(0, 14000)}`;

  const raw = await generate(prompt);
  if (!raw) return null;
  try {
    const json = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    const data = JSON.parse(json);
    const allowed = ["draft","applied","screening","round1","round2","offer","rejected"];
    const nextStatus = typeof data.nextStatus === "string" && allowed.includes(data.nextStatus) ? data.nextStatus : null;
    const reason = typeof data.reason === "string" ? data.reason : "";
    return { nextStatus, reason };
  } catch {
    return null;
  }
}

/** Call when generate() returned empty; returns a short message for the API response. */
function getAIUnavailableMessage() {
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY?.trim();
  if (!hasGemini && !hasAnthropic) {
    return "No AI key set. Add GEMINI_API_KEY (free at https://aistudio.google.com/apikey) or ANTHROPIC_API_KEY to server/.env and restart the server.";
  }
  return "AI returned no response. Check the server terminal for errors (invalid key, quota, or network). Ensure GEMINI_API_KEY or ANTHROPIC_API_KEY in server/.env is correct and restart.";
}

async function parseResumeWithAI(text) {
  const prompt = `Extract structured data from this resume text. Return only a JSON object with: role (target role), skills (array of strings), companies (array of notable companies worked at). No markdown or code fences. Resume:\n\n${text.slice(0, 12000)}`;
  const raw = await generate(prompt);
  if (!raw) return { role: null, skills: [], companies: [] };
  try {
    const json = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    return JSON.parse(json);
  } catch {
    return { role: null, skills: [], companies: [] };
  }
}

async function extractProfileFromResume(text) {
  const prompt = `Extract profile fields from this resume text. Return only a JSON object with:
- name (string, full name)
- headline (string, one line e.g. "Senior Product Designer · 6 years experience")
- narrative (string, 2-4 sentences summarizing background and value)
- lookingFor (string, optional, what they are looking for if mentioned)
- skills (array of strings, key skills)
- timeline (array of objects, most recent first: { year, endDate optional e.g. "2022" or "Present", type: "work"|"edu"|"other", title, sub, desc, highlight: boolean })
No markdown or code fences. Resume:\n\n${text.slice(0, 12000)}`;
  const raw = await generate(prompt);
  if (!raw) return null;
  try {
    const json = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    const data = JSON.parse(json);
    return {
      name: typeof data.name === "string" ? data.name : "",
      headline: typeof data.headline === "string" ? data.headline : "",
      narrative: typeof data.narrative === "string" ? data.narrative : "",
      lookingFor: typeof data.lookingFor === "string" ? data.lookingFor : "",
      skills: Array.isArray(data.skills) ? data.skills.filter((s) => typeof s === "string") : [],
      timeline: Array.isArray(data.timeline)
        ? data.timeline.map((t) => ({
            year: String(t?.year ?? ""),
            endDate: typeof t?.endDate === "string" ? t.endDate : undefined,
            type: ["work", "edu", "other"].includes(t?.type) ? t.type : "work",
            title: String(t?.title ?? ""),
            sub: String(t?.sub ?? ""),
            desc: String(t?.desc ?? ""),
            highlight: Boolean(t?.highlight),
          }))
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Format the user's My Story profile into a single, unambiguous text block for the AI.
 * This is the shared "mental map" so the AI and user are aligned — use only this data when writing emails/CVs.
 */
function formatProfileForAI(profile) {
  if (!profile || typeof profile !== "object") return "";
  const p = profile;
  const lines = [];

  lines.push("CANDIDATE PROFILE (My Story — use this as the single source of truth. Do not infer from resume; use only what is below.)");
  lines.push("");

  if (p.name) lines.push(`Name: ${String(p.name)}`);
  if (p.headline) lines.push(`Headline: ${String(p.headline)}`);
  lines.push("");

  if (p.narrative) {
    lines.push("Summary / narrative:");
    lines.push(String(p.narrative));
    lines.push("");
  }
  if (p.lookingFor) {
    lines.push("What they are looking for:");
    lines.push(String(p.lookingFor));
    lines.push("");
  }
  if (Array.isArray(p.skills) && p.skills.length > 0) {
    lines.push(`Skills: ${p.skills.filter((s) => typeof s === "string").join(", ")}`);
    lines.push("");
  }
  if (Array.isArray(p.timeline) && p.timeline.length > 0) {
    lines.push("Career timeline (dates, type, role, organisation, description):");
    const typeLabel = { work: "Work", edu: "Education", award: "Award", project: "Project", other: "Activity" };
    p.timeline.forEach((t) => {
      const dateRange = [t.year, t.endDate].filter(Boolean).join(" – ") || "(no dates)";
      const type = typeLabel[t.type] || t.type || "Work";
      const parts = [`${dateRange} | ${type}: ${t.title || ""}${t.sub ? ` at ${t.sub}` : ""}`];
      if (t.desc) parts.push(` ${t.desc}`);
      lines.push("- " + parts.join(""));
    });
    lines.push("");
  }
  if (Array.isArray(p.strengths) && p.strengths.length > 0) {
    lines.push("Strengths: " + p.strengths.map((s) => `${s.label || ""} (${s.score}%)`).filter(Boolean).join("; "));
    lines.push("");
  }
  if (Array.isArray(p.observations) && p.observations.length > 0) {
    lines.push("Observations:");
    p.observations.forEach((o) => {
      if (o.title || o.text) lines.push(`- ${o.title || ""}: ${o.text || ""}`);
    });
    lines.push("");
  }
  if (p.workRights) lines.push(`Work rights / visa: ${String(p.workRights)}`);
  if (p.basedIn) lines.push(`Based in: ${String(p.basedIn)}`);
  if (p.openToRelocate) lines.push(`Open to relocate: ${String(p.openToRelocate)}`);
  if (Array.isArray(p.targetCountries) && p.targetCountries.length > 0) {
    lines.push(`Target countries: ${p.targetCountries.filter((c) => typeof c === "string").join(", ")}`);
  }

  return lines.join("\n").trim();
}

const COMMS_STAGE_PROMPTS = {
  draft: "Write a cover letter / application email. Standard intro, value proposition, and why you are a fit for the role.",
  applied: "Write a brief follow-up email. Reference your original application and add one new value point. Keep it short.",
  screening: "Write a pre-interview note. Confirm logistics if needed and include one genuine question about the team or role.",
  round1: "Write a thank-you email after an interview. Reference something specific from the conversation and reaffirm your fit.",
  round2: "Write a thank-you email after a second-round interview. Reference something specific and reiterate interest.",
  offer: "Write a negotiation email. Acknowledge the offer, state your counter with brief reasoning, keep the tone warm and professional.",
  rejected: "Write a gracious response. Thank them, ask to be considered for future roles, no bitterness.",
};

async function analyzeJdWithAI({ jdText, profile, companyName, role }) {
  const profileContext = profile && typeof profile === "object"
    ? `\n\nCandidate profile (for match):\n${formatProfileForAI(profile)}`
    : "";
  const prompt = `Analyze this job description against the candidate and return a JSON object with:
- matchScore: number 0-100 (overall fit)
- matchedKeywords: array of strings (requirements/skills the candidate clearly has)
- missingKeywords: array of strings (requirements the candidate may lack or should emphasize)
- suggestedAngle: string (one sentence: how the candidate should position themselves for this role)
- redFlags: array of strings (potential concerns or gaps to address, or empty array)
Return only the JSON object, no markdown or code fences.

Job description:\n${(jdText || "").slice(0, 8000)}\n\nCompany: ${companyName || "Unknown"}. Role: ${role || "Unknown"}.${profileContext}`;
  const raw = await generate(prompt);
  if (!raw) return { matchScore: 0, matchedKeywords: [], missingKeywords: [], suggestedAngle: "", redFlags: [] };
  try {
    const json = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    const data = JSON.parse(json);
    return {
      matchScore: Math.min(100, Math.max(0, Number(data.matchScore) || 0)),
      matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords.filter((k) => typeof k === "string") : [],
      missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.filter((k) => typeof k === "string") : [],
      suggestedAngle: String(data.suggestedAngle ?? ""),
      redFlags: Array.isArray(data.redFlags) ? data.redFlags.filter((r) => typeof r === "string") : [],
    };
  } catch {
    return { matchScore: 0, matchedKeywords: [], missingKeywords: [], suggestedAngle: "", redFlags: [] };
  }
}

async function generateEmailWithAI({ companyName, role, tone = "professional", length = "standard", profile, stage = "draft", jdText, jdAnalysis, companyCountry, companyVisaRequired, templateBody }) {
  const profileContext = profile && typeof profile === "object"
    ? `\n\nUse ONLY this candidate profile (My Story) to tailor the message. Do not invent details.\n\n${formatProfileForAI(profile)}`
    : "";

  if (templateBody && typeof templateBody === "string" && templateBody.trim().length > 50) {
    const adaptPrompt = `Adapt the following email draft/template for this specific company and role. Keep the structure and tone but replace company name, role, and any placeholders with the details below. Return only the adapted email body, no subject line.

Company: ${companyName}. Role: ${role}.${profileContext}

Template/draft to adapt:
---
${templateBody.slice(0, 4000)}
---`;
    const text = await generate(adaptPrompt);
    return text || templateBody;
  }

  let jdContext = "";
  if (jdAnalysis && typeof jdAnalysis === "object" && jdAnalysis.suggestedAngle) {
    jdContext = `\n\nSuggested angle for this role: ${jdAnalysis.suggestedAngle}`;
    if (Array.isArray(jdAnalysis.matchedKeywords) && jdAnalysis.matchedKeywords.length > 0) {
      jdContext += `\nKeywords to reflect: ${jdAnalysis.matchedKeywords.join(", ")}`;
    }
    if (Array.isArray(jdAnalysis.missingKeywords) && jdAnalysis.missingKeywords.length > 0) {
      jdContext += `\nAddress or acknowledge if relevant: ${jdAnalysis.missingKeywords.join(", ")}`;
    }
  } else if (jdText && typeof jdText === "string" && jdText.trim()) {
    jdContext = `\n\nRelevant job description excerpt (use to tailor):\n${jdText.slice(0, 2000)}`;
  }
  let locationContext = "";
  if (companyCountry || companyVisaRequired) {
    locationContext = "\n\nLocation/visa: This role is in " + (companyCountry || "another country") + ". Visa required: " + (companyVisaRequired ? "yes" : "no") + ". If the candidate's work rights or relocation stance is relevant, mention it briefly (e.g. work authorization, open to relocate).";
  }
  const stageInstruction = COMMS_STAGE_PROMPTS[stage] || COMMS_STAGE_PROMPTS.draft;
  const prompt = `Company: ${companyName}. Role: ${role}. Tone: ${tone}. Length: ${length}.\n\n${stageInstruction}${profileContext}${jdContext}${locationContext}\n\nReturn only the email body, no subject line.`;
  const text = await generate(prompt);
  return text || "";
}

async function generateSubjectLinesWithAI({ companyName, role, profile }) {
  const profileContext = profile && typeof profile === "object"
    ? `\n\nCandidate context:\n${formatProfileForAI(profile)}`
    : "";
  const prompt = `Generate exactly 3 short, professional email subject lines for a job application to ${role} at ${companyName}. Return only the 3 subject lines, one per line, no numbering.${profileContext}`;
  const text = await generate(prompt);
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function generateAIInsights(profile) {
  const profileText = profile && typeof profile === "object" ? formatProfileForAI(profile) : "";
  const prompt = `Based on this career profile (My Story), provide 3-5 short AI observations as a JSON array. Each: { type: "strength"|"gap"|"tip"|"pattern", icon: string, title: string, text: string }. Return only the JSON array, no markdown. Profile:\n\n${profileText}`;
  const raw = await generate(prompt);
  if (!raw) return [];
  try {
    const json = raw.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function refineEmailWithAI(currentEmail, prompt) {
  const fullPrompt = `Refine this cover letter based on the prompt. Return only the revised letter, no explanation.\n\nCurrent:\n${currentEmail}\n\nPrompt: ${prompt}`;
  const text = await generate(fullPrompt);
  return text || currentEmail;
}

module.exports = {
  parseResumeWithAI,
  extractProfileFromResume,
  analyzeJdWithAI,
  generateEmailWithAI,
  generateAIInsights,
  refineEmailWithAI,
  getAIUnavailableMessage,
  generateSubjectLinesWithAI,
  classifyEmailThreadWithAI,
};
