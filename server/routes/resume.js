const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { parseResumeWithAI } = require("../lib/ai");

const router = express.Router();

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

router.post("/upload", upload.single("resume"), async (req, res) => {
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
    const parsed = await parseResumeWithAI(text);
    res.json({ text: text.slice(0, 2000), parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
