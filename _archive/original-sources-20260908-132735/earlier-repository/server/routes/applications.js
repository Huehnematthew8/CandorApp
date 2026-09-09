const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/industries", async (req, res) => {
  try {
    const industries = await prisma.industry.findMany({
      where: { userId: req.userId },
      include: {
        companies: { include: { contacts: true, notes: true } },
      },
      orderBy: { order: "asc" },
    });
    res.json(industries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/industries", async (req, res) => {
  try {
    const { name, emoji } = req.body;
    const industry = await prisma.industry.create({
      data: {
        userId: req.userId,
        name: name || "Untitled",
        emoji: emoji || "💻",
      },
    });
    res.json(industry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/industries/:id", async (req, res) => {
  try {
    const { name, emoji, open } = req.body;
    const industry = await prisma.industry.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { name, emoji, open },
    });
    if (industry.count === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/industries/:id", async (req, res) => {
  try {
    await prisma.industry.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/industries/:id/companies", async (req, res) => {
  try {
    const { name, role, location, salary } = req.body;
    const industry = await prisma.industry.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!industry) return res.status(404).json({ error: "Industry not found" });
    const company = await prisma.company.create({
      data: {
        industryId: industry.id,
        name: name || "New Company",
        role: role || "",
        location,
        salary,
      },
    });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/companies/:id", async (req, res) => {
  try {
    const { name, role, location, salary, status, emailTo, emailSubject, emailDraft } = req.body;
    const company = await prisma.company.findFirst({
      where: { id: req.params.id },
      include: { industry: true },
    });
    if (!company || company.industry.userId !== req.userId) {
      return res.status(404).json({ error: "Company not found" });
    }
    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: { name, role, location, salary, status, emailTo, emailSubject, emailDraft },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/companies/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const company = await prisma.company.findFirst({
      where: { id: req.params.id },
      include: { industry: true },
    });
    if (!company || company.industry.userId !== req.userId) {
      return res.status(404).json({ error: "Company not found" });
    }
    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies/:id/notes", async (req, res) => {
  try {
    const { content } = req.body;
    const company = await prisma.company.findFirst({
      where: { id: req.params.id },
      include: { industry: true },
    });
    if (!company || company.industry.userId !== req.userId) {
      return res.status(404).json({ error: "Company not found" });
    }
    const note = await prisma.note.create({
      data: { companyId: company.id, content: content || "" },
    });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies/:id/contacts", async (req, res) => {
  try {
    const { name, role, initials } = req.body;
    const company = await prisma.company.findFirst({
      where: { id: req.params.id },
      include: { industry: true },
    });
    if (!company || company.industry.userId !== req.userId) {
      return res.status(404).json({ error: "Company not found" });
    }
    const contact = await prisma.contact.create({
      data: { companyId: company.id, name: name || "", role, initials },
    });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
