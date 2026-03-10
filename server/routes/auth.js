const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { v4: uuidv4 } = require("uuid");
const { prisma } = require("../lib/db");
const { auth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function signAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

async function createRefreshToken(userId) {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
  return { token, expiresAt };
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
      select: { id: true, email: true, name: true },
    });
    const accessToken = signAccessToken(user.id);
    const { token: refreshToken } = await createRefreshToken(user.id);
    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const accessToken = signAccessToken(user.id);
    const { token: refreshToken } = await createRefreshToken(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "ID token required" });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, googleId },
        select: { id: true, email: true, name: true },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
        select: { id: true, email: true, name: true },
      });
    }
    const accessToken = signAccessToken(user.id);
    const { token: refreshToken } = await createRefreshToken(user.id);
    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid Google token" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    const { token: newRefreshToken } = await createRefreshToken(tokenRecord.userId);
    const accessToken = signAccessToken(tokenRecord.userId);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.userId },
      });
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
