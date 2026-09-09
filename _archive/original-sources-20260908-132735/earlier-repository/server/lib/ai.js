const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function parseResumeWithAI(text) {
  const { content } = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract structured data from this resume text. Return a JSON object with: role (target role), skills (array of strings), companies (array of notable companies worked at). Resume:\n\n${text.slice(0, 12000)}`,
      },
    ],
  });
  const block = content.find((c) => c.type === "text");
  try {
    const json = block.text.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    return JSON.parse(json);
  } catch {
    return { role: null, skills: [], companies: [] };
  }
}

async function generateEmailWithAI({ companyName, role, tone = "professional", length = "standard" }) {
  const { content } = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Write a cover letter/email for applying to ${role} at ${companyName}. Tone: ${tone}. Length: ${length}. Be specific and professional.`,
      },
    ],
  });
  const block = content.find((c) => c.type === "text");
  return block ? block.text : "";
}

async function generateAIInsights(profile) {
  const { content } = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Based on this career profile, provide 3-5 short AI observations as a JSON array. Each: { type: "strength"|"gap"|"tip"|"pattern", icon: string, title: string, text: string }. Profile: ${JSON.stringify(profile)}`,
      },
    ],
  });
  const block = content.find((c) => c.type === "text");
  try {
    const json = block.text.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
    return JSON.parse(json);
  } catch {
    return [];
  }
}

module.exports = { parseResumeWithAI, generateEmailWithAI, generateAIInsights };
