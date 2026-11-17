// Profile-views counter: a Cloudflare Worker that returns an SVG badge and
// bumps a KV counter on every request. GitHub proxies README images through
// camo, so the response is marked uncacheable to make each page load hit us.
//
//   GET /?username=TerminalExplore&theme=dark|light

const THEMES = {
  dark: { bg: "#0d1117", border: "#30363d", label: "#8d96a0", value: "#e6edf3" },
  light: { bg: "#ffffff", border: "#d0d7de", label: "#59636e", value: "#1f2328" },
};

const FONT_STACK = "'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace";
const FONT_SIZE = 11;
const CHAR_WIDTH = FONT_SIZE * 0.6;
const PAD = 8;
const HEIGHT = 20;

function badge(count, theme) {
  const t = THEMES[theme] || THEMES.dark;
  const label = "views";
  const value = count.toLocaleString("en-US");
  const labelWidth = Math.round(label.length * CHAR_WIDTH + PAD * 2);
  const valueWidth = Math.round(value.length * CHAR_WIDTH + PAD * 2);
  const width = labelWidth + valueWidth;
  const textY = HEIGHT / 2 + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${label}: ${value}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="6" fill="${t.bg}" stroke="${t.border}" />
  <line x1="${labelWidth}" y1="1" x2="${labelWidth}" y2="${HEIGHT - 1}" stroke="${t.border}" />
  <text x="${labelWidth / 2}" y="${textY}" text-anchor="middle" font-family="${FONT_STACK}" font-size="${FONT_SIZE}" fill="${t.label}">${label}</text>
  <text x="${labelWidth + valueWidth / 2}" y="${textY}" text-anchor="middle" font-family="${FONT_STACK}" font-size="${FONT_SIZE}" font-weight="600" fill="${t.value}">${value}</text>
</svg>
`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const username = (url.searchParams.get("username") || "").toLowerCase();

    // Only count for the configured profile, so the KV namespace can't be
    // filled with arbitrary keys by anyone who finds the URL.
    if (request.method !== "GET" || url.pathname !== "/" || username !== env.ALLOWED_USERNAME.toLowerCase()) {
      return new Response("Not found", { status: 404 });
    }

    const key = `views:${username}`;
    let count = Number((await env.VIEWS.get(key)) ?? 0) + 1;
    try {
      await env.VIEWS.put(key, String(count));
    } catch {
      // KV's free tier caps writes per day; keep serving the badge rather
      // than breaking the image on the profile.
    }

    return new Response(badge(count, url.searchParams.get("theme")), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
      },
    });
  },
};
