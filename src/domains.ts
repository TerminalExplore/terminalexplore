export const SITE_ORIGIN = "https://terminalexplore.org";
export const BLOG_ORIGIN = "https://blog.terminalexplore.org";
export const LINKS_ORIGIN = "https://links.terminalexplore.org";

const BLOG_HOSTS = new Set(["blog.terminalexplore.org", "blog.tmxpl.ru"]);
const LINKS_HOSTS = new Set(["links.terminalexplore.org", "links.tmxpl.ru"]);

export function isBlogHost(hostname = window.location.hostname) {
  return BLOG_HOSTS.has(hostname);
}

export function isLinksHost(hostname = window.location.hostname) {
  return LINKS_HOSTS.has(hostname);
}

export function canonicalOrigin(hostname = window.location.hostname) {
  if (isBlogHost(hostname)) return BLOG_ORIGIN;
  if (isLinksHost(hostname)) return LINKS_ORIGIN;
  return SITE_ORIGIN;
}
