const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

router.post("/view", (req, res) => {
  const path = String(req.body?.path || req.headers["x-view-path"] || "/").slice(0, 300);
  const referrer = String(req.headers.referer || "").slice(0, 500);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);
  db.prepare("INSERT INTO page_views (path, referrer, user_agent) VALUES (?, ?, ?)").run(path, referrer, userAgent);
  res.status(204).end();
});

router.get("/summary", requireAuth, (req, res) => {
  const total = db.prepare("SELECT count(*) c FROM page_views").get().c;
  const today = db.prepare("SELECT count(*) c FROM page_views WHERE date(created_at) = date('now')").get().c;
  const top = db
    .prepare("SELECT path, count(*) views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 10")
    .all();
  const recent = db
    .prepare("SELECT path, referrer, created_at FROM page_views ORDER BY created_at DESC LIMIT 20")
    .all();
  res.json({ total, today, top, recent });
});

module.exports = router;
