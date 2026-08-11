const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const db = require("../db");
const { appName, jwtSecret, tokenTtl } = require("../config");
const { loginRateLimit, requireAuth } = require("../middleware");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  if (password.length < 12) return res.status(400).json({ error: "password min 12 chars" });
  const hash = await bcrypt.hash(password, 10);
  try {
    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email.toLowerCase(), hash);
  } catch {
    return res.status(409).json({ error: "email already registered" });
  }
  res.status(201).json({ ok: true });
});

router.post("/login", loginRateLimit, async (req, res) => {
  const { email, password, totp } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) {
    req.recordFailedLogin();
    return res.status(401).json({ error: "invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    req.recordFailedLogin();
    return res.status(401).json({ error: "invalid credentials" });
  }

  if (user.totp_enabled && user.totp_secret) {
    if (!totp) return res.status(403).json({ error: "2fa required", requireTotp: true });
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: totp,
      window: 1,
    });
    if (!verified) {
      req.recordFailedLogin();
      return res.status(401).json({ error: "invalid 2fa code" });
    }
  }

  req.clearFailedLogins();
  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: tokenTtl });
  res.json({
    token,
    user: { id: user.id, email: user.email, totpEnabled: !!user.totp_enabled },
  });
});

router.post("/2fa/setup", requireAuth, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `${appName}:${req.user.email}` });
  db.prepare("UPDATE users SET totp_secret = ? WHERE id = ?").run(secret.base32, req.user.id);
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qr: qrDataUrl });
});

router.post("/2fa/verify", requireAuth, (req, res) => {
  const { token } = req.body || {};
  const user = db.prepare("SELECT totp_secret FROM users WHERE id = ?").get(req.user.id);
  if (!user || !user.totp_secret) return res.status(400).json({ error: "2fa not set up" });
  const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: "base32", token, window: 1 });
  if (!verified) return res.status(400).json({ error: "invalid code" });
  db.prepare("UPDATE users SET totp_enabled = 1 WHERE id = ?").run(req.user.id);
  res.json({ ok: true });
});

router.post("/2fa/disable", requireAuth, async (req, res) => {
  const { password } = req.body || {};
  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "not found" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid password" });
  db.prepare("UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?").run(req.user.id);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email, totp_enabled FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "not found" });
  res.json({ user: { id: user.id, email: user.email, totpEnabled: !!user.totp_enabled } });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword required" });
  if (newPassword.length < 12) return res.status(400).json({ error: "new password min 12 chars" });
  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "not found" });
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid current password" });
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.user.id);
  res.json({ ok: true });
});

router.post("/change-email", requireAuth, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "not found" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid password" });
  try {
    db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email.toLowerCase(), req.user.id);
  } catch {
    return res.status(409).json({ error: "email already in use" });
  }
  const updated = db.prepare("SELECT id, email, totp_enabled FROM users WHERE id = ?").get(req.user.id);
  res.json({ ok: true, user: { id: updated.id, email: updated.email, totpEnabled: !!updated.totp_enabled } });
});

module.exports = router;
