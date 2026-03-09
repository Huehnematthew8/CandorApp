const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { PrismaClient } = require("@prisma/client");
const { parseResumeWithAI, extractProfileFromResume } = require("../lib/ai");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "resumes");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and DOCX allowed"));
  },
});

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

router.post("/upload", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    let text = "";
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      return res.status(400).json({ error: "DOCX parsing not implemented; use PDF" });
    }
    if (!text || text.length < 50) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    await ensureUploadDir();
    const filePath = path.join(UPLOAD_DIR, `${req.userId}.pdf`);
    await fs.writeFile(filePath, req.file.buffer);

    const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
    const currentData = (existing?.data && typeof existing.data === "object") ? existing.data : {};
    const updatedData = { ...currentData, resumeUploadedAt: new Date().toISOString() };
    await prisma.profile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, data: updatedData },
      update: { data: updatedData, updatedAt: new Date() },
    });

    let parsed = { role: null, skills: [], companies: [] };
    let profileExtract = null;
    if (process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      try {
        parsed = await parseResumeWithAI(text);
      } catch (aiErr) {
        console.warn("Resume AI parse skipped:", aiErr.message);
      }
      try {
        profileExtract = await extractProfileFromResume(text);
        if (!profileExtract) console.warn("Resume profile extract returned null (check Gemini response)");
      } catch (aiErr) {
        console.warn("Resume profile extract error:", aiErr.message);
      }
    }
    res.json({ text: text.slice(0, 2000), parsed, profileExtract });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/file", auth, async (req, res) => {
  try {
    const filePath = path.join(UPLOAD_DIR, `${req.userId}.pdf`);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "No resume uploaded" });
    }
    const buffer = await fs.readFile(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
