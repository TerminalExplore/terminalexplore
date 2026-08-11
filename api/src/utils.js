function slugify(s) {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "post"
  );
}

function pickPostInput(body = {}) {
  return {
    content: String(body.content || ""),
    cover_url: String(body.cover_url || ""),
    excerpt: String(body.excerpt || ""),
    published: body.published ? 1 : 0,
    seo_description: String(body.seo_description || ""),
    seo_title: String(body.seo_title || ""),
    slug: slugify(body.slug || body.title),
    tag: String(body.tag || ""),
    title: String(body.title || ""),
  };
}

module.exports = { pickPostInput, slugify };
