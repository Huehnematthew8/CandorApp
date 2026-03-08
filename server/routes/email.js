const express = require("express");
const { generateEmailWithAI, generateAIInsights, refineEmailWithAI } = require("../lib/ai");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  try {
    const { companyName, role, tone, length, profile } = req.body;
    if (!companyName || !role) {
      return res.status(400).json({ error: "companyName and role required" });
    }
    const email = await generateEmailWithAI({
      companyName,
      role,
      tone: tone || "professional",
      length: length || "standard",
      profile: profile || undefined,
    });
    if (!email || (typeof email === "string" && !email.trim())) {
      return res.status(503).json({
        error: "AI did not return a response. Check that GEMINI_API_KEY or ANTHROPIC_API_KEY is set in server .env and restart the server.",
      });
    }
    res.json({ email });
  } catch (err) {
    console.error("Email generate error:", err);
    res.status(500).json({ error: err.message || "Email generation failed" });
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
    const email = await refineEmailWithAI(currentEmail, prompt);
    if (!email || (typeof email === "string" && !email.trim())) {
      return res.status(503).json({
        error: "AI did not return a response. Check GEMINI_API_KEY or ANTHROPIC_API_KEY in server .env.",
      });
    }
    res.json({ email });
  } catch (err) {
    console.error("Email refine error:", err);
    res.status(500).json({ error: err.message || "Refine failed" });
  }
});

module.exports = router;
