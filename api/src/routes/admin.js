const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

router.get("/posts", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  res.json(rows);
});

module.exports = router;
