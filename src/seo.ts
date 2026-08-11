import type { Post } from "./types";

const siteName = "TerminalExplore";
const defaultDescription =
  "Код и инфраструктура: разработка, DevOps, мониторинг, сети и контейнеризация.";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function setHomeSeo() {
  document.title = `${siteName} - Код + Инфраструктура`;
  setMeta('meta[name="description"]', "content", defaultDescription);
  setMeta('meta[property="og:title"]', "content", siteName);
  setMeta('meta[property="og:description"]', "content", defaultDescription);
}

export function setPostSeo(post: Post) {
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || defaultDescription;
  document.title = `${title} - ${siteName}`;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
}
