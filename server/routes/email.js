const express = require("express");
const { generateEmailWithAI, generateAIInsights, refineEmailWithAI, getAIUnavailableMessage, generateSubjectLinesWithAI } = require("../lib/ai");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  try {
    const { companyName, role, tone, length, profile, stage, jdText, jdAnalysis, companyCountry, companyVisaRequired, templateBody } = req.body;
    if (!companyName || !role) {
      return res.status(400).json({ error: "companyName and role required" });
    }
    const email = await generateEmailWithAI({
      companyName,
      role,
      tone: tone || "professional",
      length: length || "standard",
      profile: profile || undefined,
      stage: stage || "draft",
      jdText: jdText || undefined,
      jdAnalysis: jdAnalysis || undefined,
      companyCountry: companyCountry || undefined,
      companyVisaRequired: companyVisaRequired === true || companyVisaRequired === "true",
      templateBody: templateBody || undefined,
    });
    if (!email || (typeof email === "string" && !email.trim())) {
      return res.status(503).json({
        error: getAIUnavailableMessage(),
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

router.post("/subject-lines", auth, async (req, res) => {
  try {
    const { companyName, role, profile } = req.body;
    if (!companyName || !role) {
      return res.status(400).json({ error: "companyName and role required" });
    }
    const lines = await generateSubjectLinesWithAI({ companyName, role, profile: profile || undefined });
    res.json({ subjectLines: Array.isArray(lines) ? lines : [] });
  } catch (err) {
    console.error("Subject lines error:", err);
    res.status(500).json({ error: err.message || "Failed to generate subject lines" });
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
        error: getAIUnavailableMessage(),
      });
    }
    res.json({ email });
  } catch (err) {
    console.error("Email refine error:", err);
    res.status(500).json({ error: err.message || "Refine failed" });
  }
});

module.exports = router;
