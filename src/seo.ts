import type { Post } from "./types";
import {
  BLOG_ORIGIN,
  LINKS_ORIGIN,
  SITE_ORIGIN,
  canonicalOrigin,
  isBlogHost,
  isLinksHost,
} from "./domains";

const siteName = "TerminalExplore";
const defaultDescription =
  "Web projects in production: frontend, API, CI/CD, monitoring, networks and automation.";
const defaultImage = `${SITE_ORIGIN}/og-image.svg?v=1`;

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setUrl(url: string) {
  setCanonical(url);
  setMeta('meta[property="og:url"]', "content", url);
}

function currentCanonicalUrl() {
  const path = window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/+$/, "");
  return `${canonicalOrigin()}${path}`;
}

export function setHomeSeo() {
  if (isLinksHost()) {
    const title = `${siteName} - Links`;
    const description = "All TerminalExplore links: contact, code, blog, cases and resources.";
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setUrl(`${LINKS_ORIGIN}/`);
    setMeta('meta[property="og:image"]', "content", defaultImage);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", defaultImage);
    return;
  }

  if (isBlogHost()) {
    const title = `${siteName} - Blog`;
    const description = "Notes on web development, infrastructure, deployment and operations.";
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setUrl(`${BLOG_ORIGIN}/`);
    setMeta('meta[property="og:image"]', "content", defaultImage);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", defaultImage);
    return;
  }

  document.title = `${siteName} - Web projects in production`;
  setMeta('meta[name="description"]', "content", defaultDescription);
  setMeta('meta[property="og:title"]', "content", siteName);
  setMeta('meta[property="og:description"]', "content", defaultDescription);
  setUrl(currentCanonicalUrl());
  setMeta('meta[property="og:image"]', "content", defaultImage);
  setMeta('meta[property="og:type"]', "content", "website");
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
  setUrl(`${BLOG_ORIGIN}/post/${encodeURIComponent(post.slug)}`);
  setMeta('meta[property="og:image"]', "content", image);
  setMeta('meta[property="og:type"]', "content", "article");
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:image"]', "content", image);
}
