const express = require("express");
const db = require("./src/db");
const { port } = require("./src/config");
const { requestId, securityHeaders } = require("./src/middleware");
const authRoutes = require("./src/routes/auth");
const postRoutes = require("./src/routes/posts");
const adminRoutes = require("./src/routes/admin");
const feedRoutes = require("./src/routes/feeds");
const caseRoutes = require("./src/routes/cases");
const statRoutes = require("./src/routes/stats");
const mediaRoutes = require("./src/routes/media");
const backupRoutes = require("./src/routes/backups");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestId);
app.use(securityHeaders);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use(mediaRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
app.use("/cases", caseRoutes);
app.use("/stats", statRoutes);
app.use("/admin", backupRoutes);
app.use(feedRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(`[${req.id}]`, err);
  res.status(500).json({ error: "internal server error", requestId: req.id });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`blog-api listening on ${port}`);
});
