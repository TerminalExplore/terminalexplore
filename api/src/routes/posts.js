const express = require("express");
const db = require("../db");
const { getUser, requireAuth } = require("../middleware");
const { pickPostInput } = require("../utils");

const router = express.Router();

const publicFields =
  "id, slug, title, excerpt, tag, cover_url, seo_title, seo_description, published, created_at, updated_at";

router.get("/", (req, res) => {
  const rows = db.prepare(`SELECT ${publicFields} FROM posts WHERE published = 1 ORDER BY created_at DESC`).all();
  res.json(rows);
});

router.get("/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "not found" });
  if (!row.published && !getUser(req)) return res.status(404).json({ error: "not found" });
  res.json(row);
});

router.post("/", requireAuth, (req, res) => {
  const input = pickPostInput(req.body);
  if (!input.title || !input.content) return res.status(400).json({ error: "title and content required" });

  const exists = db.prepare("SELECT id FROM posts WHERE slug = ?").get(input.slug);
  if (exists) return res.status(409).json({ error: "slug already exists" });

  const info = db
    .prepare(
      `INSERT INTO posts
       (slug, title, excerpt, content, tag, published, cover_url, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.tag,
      input.published,
      input.cover_url,
      input.seo_title,
      input.seo_description
    );
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });

  const input = pickPostInput({ ...existing, ...req.body });
  if (!input.title || !input.content) return res.status(400).json({ error: "title and content required" });

  const slugOwner = db.prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").get(input.slug, req.params.id);
  if (slugOwner) return res.status(409).json({ error: "slug already exists" });

  db.prepare(
    `UPDATE posts
     SET slug=?, title=?, excerpt=?, content=?, tag=?, published=?, cover_url=?, seo_title=?, seo_description=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    input.slug,
    input.title,
    input.excerpt,
    input.content,
    input.tag,
    input.published,
    input.cover_url,
    input.seo_title,
    input.seo_description,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
