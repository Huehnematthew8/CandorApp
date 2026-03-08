const express = require("express");
const { generateEmailWithAI, generateAIInsights } = require("../lib/ai");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  try {
    const { companyName, role, tone, length } = req.body;
    if (!companyName || !role) {
      return res.status(400).json({ error: "companyName and role required" });
    }
    const email = await generateEmailWithAI({
      companyName,
      role,
      tone: tone || "professional",
      length: length || "standard",
    });
    res.json({ email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/insights", auth, async (req, res) => {
  try {
    const profile = req.body;
    const observations = await generateAIInsights(profile);
    res.json({ observations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/refine", auth, async (req, res) => {
  try {
    const { currentEmail, prompt } = req.body;
    if (!currentEmail || !prompt) {
      return res.status(400).json({ error: "currentEmail and prompt required" });
    }
    const { default: Anthropic } = require("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const { content } = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Refine this cover letter based on the prompt. Return only the revised letter.\n\nCurrent:\n${currentEmail}\n\nPrompt: ${prompt}`,
        },
      ],
    });
    const block = content.find((c) => c.type === "text");
    res.json({ email: block ? block.text : currentEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
