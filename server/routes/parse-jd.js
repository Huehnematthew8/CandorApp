const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? stripHtml(m[1]) : "";
}

/** Try to derive company name and role from page title (e.g. "Senior Engineer at Acme" or "Acme - Job") */
function parseTitleForCompanyAndRole(title) {
  let companyName = "";
  let role = "";
  const t = (title || "").trim();
  const atMatch = t.match(/^(.+?)\s+at\s+(.+)$/i) || t.match(/^(.+?)\s*[-–|]\s*(.+)$/);
  if (atMatch) {
    role = atMatch[1].trim();
    companyName = atMatch[2].trim();
  } else if (t) {
    companyName = t;
  }
  return { companyName, role };
}

router.post("/", auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url required" });
    }
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return res.status(400).json({ error: "Invalid URL" });
    }
    const response = await fetch(trimmed, {
      headers: { "User-Agent": "Candor-Job-Parser/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return res.status(502).json({ error: "Could not fetch URL" });
    }
    const html = await response.text();
    const title = getTitle(html);
    const text = stripHtml(html).slice(0, 50000);
    const { companyName, role } = parseTitleForCompanyAndRole(title);
    res.json({
      companyName: companyName || null,
      role: role || null,
      jdText: text.length > 0 ? text : null,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out" });
    }
    console.error("Parse JD error:", err);
    res.status(500).json({ error: err.message || "Failed to parse URL" });
  }
});

module.exports = router;
