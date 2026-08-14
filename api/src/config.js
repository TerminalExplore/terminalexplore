const crypto = require("crypto");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";
const siteUrl = (process.env.SITE_URL || "http://localhost:8090").replace(/\/+$/, "");

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production");
}

module.exports = {
  appName: process.env.APP_NAME || "TerminalExplore",
  dbPath: process.env.DB_PATH || path.join(__dirname, "..", "data", "blog.db"),
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "..", "data", "uploads"),
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, "..", "data", "backups"),
  isProduction,
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  port: Number(process.env.PORT || 3001),
  loginWindowMs: Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000),
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 8),
  siteUrl,
  blogUrl: (process.env.BLOG_URL || siteUrl).replace(/\/+$/, ""),
  tokenTtl: process.env.TOKEN_TTL || "7d",
  requestIdBytes: 8,
  fallbackSecret: crypto.randomBytes(1).toString("hex"),
};
