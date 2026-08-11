const express = require("express");
const db = require("../db");
const { siteUrl } = require("../config");

const router = express.Router();

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", (req, res) => {
  const posts = db.prepare("SELECT slug, updated_at FROM posts WHERE published = 1 ORDER BY updated_at DESC").all();
  const staticPages = ["", "cases", "status", "privacy", "terms"];
  const urls = [
    ...staticPages.map((slug) => ({ loc: `${siteUrl}/${slug}`, lastmod: new Date().toISOString() })),
    ...posts.map((post) => ({ loc: `${siteUrl}/post/${post.slug}`, lastmod: new Date(post.updated_at).toISOString() })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${xmlEscape(url.loc)}</loc><lastmod>${url.lastmod}</lastmod></url>`).join("\n")}
</urlset>`;

  res.type("application/xml").send(body);
});

router.get("/rss.xml", (req, res) => {
  const posts = db
    .prepare("SELECT slug, title, excerpt, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT 20")
    .all();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TerminalExplore blog</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>Notes on development, DevOps and infrastructure.</description>
${posts
  .map(
    (post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(`${siteUrl}/post/${post.slug}`)}</link>
      <guid>${xmlEscape(`${siteUrl}/post/${post.slug}`)}</guid>
      <description>${xmlEscape(post.excerpt)}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

  res.type("application/rss+xml").send(body);
});

module.exports = router;
