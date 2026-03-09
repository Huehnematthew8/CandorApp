const express = require("express");
const { analyzeJdWithAI } = require("../lib/ai");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/analyze", auth, async (req, res) => {
  try {
    const { jdText, profile, companyName, role } = req.body;
    if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
      return res.status(400).json({ error: "jdText required" });
    }
    const analysis = await analyzeJdWithAI({
      jdText: jdText.trim(),
      profile: profile || undefined,
      companyName: companyName || "",
      role: role || "",
    });
    res.json(analysis);
  } catch (err) {
    console.error("JD analyze error:", err);
    res.status(500).json({ error: err.message || "JD analysis failed" });
  }
});

module.exports = router;
