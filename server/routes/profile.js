const express = require("express");
const { prisma } = require("../lib/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
    });
    const data = profile?.data ?? {};
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, data },
      update: { data, updatedAt: new Date() },
    });
    res.json(profile.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
