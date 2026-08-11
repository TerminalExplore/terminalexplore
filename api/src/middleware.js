const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { jwtSecret, loginMaxAttempts, loginWindowMs, requestIdBytes } = require("./config");

const loginAttempts = new Map();

function requestId(req, res, next) {
  req.id = crypto.randomBytes(requestIdBytes).toString("hex");
  res.setHeader("X-Request-Id", req.id);
  next();
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function getUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

function loginRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, resetAt: now + loginWindowMs };

  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + loginWindowMs;
  }

  if (entry.count >= loginMaxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "too many login attempts" });
  }

  req.recordFailedLogin = () => {
    entry.count += 1;
    loginAttempts.set(key, entry);
  };
  req.clearFailedLogins = () => loginAttempts.delete(key);
  next();
}

module.exports = { getUser, loginRateLimit, requestId, requireAuth, securityHeaders };
