const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { backupDir, dbPath } = require("../config");
const { requireAuth } = require("../middleware");

const router = express.Router();

function listBackups() {
  return fs
    .readdirSync(backupDir)
    .filter((name) => name.endsWith(".db"))
    .map((name) => {
      const stat = fs.statSync(path.join(backupDir, name));
      return { name, size: stat.size, created_at: stat.birthtime.toISOString() };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

async function createBackup() {
  const name = `blog-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  const target = path.join(backupDir, name);
  await db.backup(target);
  return listBackups().find((item) => item.name === name);
}

router.get("/backups", requireAuth, (req, res) => {
  res.json(listBackups());
});

router.post("/backups", requireAuth, async (req, res, next) => {
  try {
    res.status(201).json(await createBackup());
  } catch (err) {
    next(err);
  }
});

router.get("/backups/:name", requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(backupDir, name);
  if (!file.startsWith(backupDir) || !fs.existsSync(file)) return res.status(404).json({ error: "not found" });
  res.download(file);
});

router.post("/backups/:name/restore", requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(backupDir, name);
  if (!file.startsWith(backupDir) || !fs.existsSync(file)) return res.status(404).json({ error: "not found" });
  db.close();
  fs.copyFileSync(file, dbPath);
  res.json({ ok: true, restartRequired: true });
});

module.exports = router;
