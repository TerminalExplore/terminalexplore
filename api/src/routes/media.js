const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { requireAuth } = require("../middleware");
const { uploadDir } = require("../config");

const router = express.Router();
const maxBytes = 4 * 1024 * 1024;
const types = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

router.use("/uploads", express.static(uploadDir, { fallthrough: false, maxAge: "30d" }));

router.post("/media", requireAuth, express.raw({ type: Object.keys(types), limit: maxBytes }), (req, res) => {
  const contentType = String(req.headers["content-type"] || "").split(";")[0];
  const ext = types[contentType];
  if (!ext) return res.status(415).json({ error: "unsupported image type" });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: "empty file" });

  const name = `${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, name), req.body);
  res.status(201).json({ url: `/api/uploads/${name}` });
});

module.exports = router;
