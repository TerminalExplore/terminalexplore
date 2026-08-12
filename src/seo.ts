import type { Post } from "./types";

const siteName = "TerminalExplore";
const defaultDescription =
  "Web projects in production: frontend, API, CI/CD, monitoring, networks and automation.";
const defaultImage = "https://www.tmxpl.ru/og-image.svg?v=1";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function setHomeSeo() {
  if (window.location.hostname === "links.tmxpl.ru") {
    const title = `${siteName} - Links`;
    const description = "All TerminalExplore links: contact, code, blog, cases and resources.";
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", "https://links.tmxpl.ru/");
    setMeta('meta[property="og:image"]', "content", defaultImage);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", defaultImage);
    return;
  }

  document.title = `${siteName} - Web projects in production`;
  setMeta('meta[name="description"]', "content", defaultDescription);
  setMeta('meta[property="og:title"]', "content", siteName);
  setMeta('meta[property="og:description"]', "content", defaultDescription);
  setMeta('meta[property="og:url"]', "content", "https://www.tmxpl.ru/");
  setMeta('meta[property="og:image"]', "content", defaultImage);
  setMeta('meta[name="twitter:title"]', "content", siteName);
  setMeta('meta[name="twitter:description"]', "content", defaultDescription);
  setMeta('meta[name="twitter:image"]', "content", defaultImage);
}

export function setPostSeo(post: Post) {
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || defaultDescription;
  const image = post.cover_url || defaultImage;
  document.title = `${title} - ${siteName}`;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:image"]', "content", image);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:image"]', "content", image);
}
