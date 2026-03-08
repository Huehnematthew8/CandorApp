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
  const fromGemini = await generateWithGemini(prompt).catch((e) => {
    console.warn("Gemini generate failed:", e.message);
    return null;
  });
  if (fromGemini != null) return fromGemini;
  const fromAnthropic = await generateWithAnthropic(prompt).catch((e) => {
    console.warn("Anthropic generate failed:", e.message);
    return null;
  });
  return fromAnthropic;
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
- timeline (array of objects, most recent first: { year, type: "work"|"edu"|"other", title, sub, desc, highlight: boolean })
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

async function generateEmailWithAI({ companyName, role, tone = "professional", length = "standard", profile }) {
  const profileContext = profile && typeof profile === "object"
    ? ` Use this candidate profile to tailor the letter: ${JSON.stringify(profile)}.`
    : "";
  const prompt = `Write a cover letter/email for applying to ${role} at ${companyName}. Tone: ${tone}. Length: ${length}. Be specific and professional.${profileContext}`;
  const text = await generate(prompt);
  return text || "";
}

async function generateAIInsights(profile) {
  const prompt = `Based on this career profile, provide 3-5 short AI observations as a JSON array. Each: { type: "strength"|"gap"|"tip"|"pattern", icon: string, title: string, text: string }. Return only the JSON array, no markdown. Profile: ${JSON.stringify(profile)}`;
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

module.exports = { parseResumeWithAI, extractProfileFromResume, generateEmailWithAI, generateAIInsights, refineEmailWithAI };
