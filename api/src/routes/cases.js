const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");
const { slugify } = require("../utils");

const router = express.Router();

function input(body = {}) {
  return {
    slug: slugify(body.slug || body.title),
    title: String(body.title || ""),
    summary: String(body.summary || ""),
    problem: String(body.problem || ""),
    solution: String(body.solution || ""),
    result: String(body.result || ""),
    stack: Array.isArray(body.stack) ? body.stack.join(", ") : String(body.stack || ""),
    metric: String(body.metric || ""),
    published: body.published ? 1 : 0,
  };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM cases WHERE published = 1 ORDER BY created_at DESC").all();
  res.json(rows);
});

router.get("/admin/all", requireAuth, (req, res) => {
  res.json(db.prepare("SELECT * FROM cases ORDER BY created_at DESC").all());
});

router.get("/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM cases WHERE slug = ?").get(req.params.slug);
  if (!row || !row.published) return res.status(404).json({ error: "not found" });
  res.json(row);
});

router.post("/", requireAuth, (req, res) => {
  const data = input(req.body);
  if (!data.title || !data.summary) return res.status(400).json({ error: "title and summary required" });
  const exists = db.prepare("SELECT id FROM cases WHERE slug = ?").get(data.slug);
  if (exists) return res.status(409).json({ error: "slug already exists" });
  const info = db
    .prepare(
      `INSERT INTO cases (slug, title, summary, problem, solution, result, stack, metric, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(data.slug, data.title, data.summary, data.problem, data.solution, data.result, data.stack, data.metric, data.published);
  res.status(201).json(db.prepare("SELECT * FROM cases WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM cases WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const data = input({ ...existing, ...req.body });
  const slugOwner = db.prepare("SELECT id FROM cases WHERE slug = ? AND id != ?").get(data.slug, req.params.id);
  if (slugOwner) return res.status(409).json({ error: "slug already exists" });
  db.prepare(
    `UPDATE cases
     SET slug=?, title=?, summary=?, problem=?, solution=?, result=?, stack=?, metric=?, published=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(data.slug, data.title, data.summary, data.problem, data.solution, data.result, data.stack, data.metric, data.published, req.params.id);
  res.json(db.prepare("SELECT * FROM cases WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM cases WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
