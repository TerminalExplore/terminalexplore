// Generates a static "frosted glass" terminal SVG for the GitHub profile README.
// Pure static markup (no SMIL/JS) so GitHub renders it as a plain image.
// Layout is a fixed, approved spec: do not change coordinates/sizes/colors —
// only the data feeding it changes.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const USERNAME = process.env.GH_USERNAME || "TerminalExplore";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT_FILE = path.join("assets", "terminal.svg");
const ABOUT_FILE = path.join("config", "about.txt");

if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN environment variable.");
  process.exit(1);
}

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      name
      login
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
      ) {
        totalCount
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchProfile() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": USERNAME,
    },
    body: JSON.stringify({ query: QUERY, variables: { login: USERNAME } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API responded with ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GitHub API errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data.user;
}

function topLanguages(repositories, limit = 3) {
  const bytesByLanguage = new Map();
  for (const repo of repositories.nodes) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      bytesByLanguage.set(name, (bytesByLanguage.get(name) || 0) + edge.size);
    }
  }
  const total = [...bytesByLanguage.values()].reduce((a, b) => a + b, 0) || 1;
  return [...bytesByLanguage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, bytes]) => ({
      name,
      percent: Math.round((bytes / total) * 100),
    }));
}

function daysSince(dateString) {
  const ms = Date.now() - new Date(dateString).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function computeStreak(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].contributionCount > 0; i--) {
    current++;
  }
  return { current, longest };
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Naive word-wrap: SVG doesn't reflow text, so we pre-split into tspans.
function wrapText(text, maxChars) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const FONT_STACK = "'JetBrains Mono', monospace";
const TYPE_SPEED = 0.032; // seconds per character

// Typewriter reveal for a single line of text. textLength forces the glyphs
// onto our exact char-width grid regardless of which monospace font actually
// renders on the viewer's system, so the clip-path reveal always lines up
// with whole characters (SMIL only — no JS, still a plain static image).
// anchorEnd supports right-aligned columns (stat values, percentages): the
// text is still anchored at x, but its bounding box — and so the reveal clip
// — starts at x - fullWidth instead of x.
function typeLine({
  text,
  x,
  y,
  fontSize,
  opacity = 1,
  weight,
  begin,
  id,
  anchorEnd = false,
  speed = TYPE_SPEED,
  minDur = 0.12,
  maxDur = Infinity,
}) {
  const charWidth = fontSize * 0.6;
  const fullWidth = text.length * charWidth;
  const duration = Math.min(Math.max(text.length * speed, minDur), maxDur);
  const steps = Math.max(text.length, 1);
  // The clip rect starts 2px before the text's left edge (so ascenders/serifs
  // on the first glyph aren't clipped); the reveal width has to grow past
  // fullWidth by that same margin plus a little extra, otherwise the clip's
  // right edge lands short of the text's true right edge and the last
  // character (or two) gets sliced off once "frozen" at the end of the
  // animation — that's what was happening to trailing letters like the "d"
  // in "886d".
  const clipMaxWidth = fullWidth + 6;
  const values = [];
  const keyTimes = [];
  for (let i = 0; i <= steps; i++) {
    values.push(((clipMaxWidth * i) / steps).toFixed(2));
    keyTimes.push((i / steps).toFixed(4));
  }
  const weightAttr = weight ? ` font-weight="${weight}"` : "";
  const anchorAttr = anchorEnd ? ` text-anchor="end"` : "";
  const clipX = anchorEnd ? x - fullWidth - 2 : x - 2;
  const svg = `
      <clipPath id="${id}">
        <rect x="${clipX.toFixed(2)}" y="${y - fontSize}" height="${fontSize + 8}" width="0">
          <animate attributeName="width" begin="${begin.toFixed(2)}s" dur="${duration.toFixed(2)}s"
            calcMode="discrete" keyTimes="${keyTimes.join(";")}" values="${values.join(";")}" fill="freeze" />
        </rect>
      </clipPath>
      <text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${fontSize}"${weightAttr}${anchorAttr}
        fill="#ffffff" opacity="${opacity}" textLength="${fullWidth.toFixed(2)}" lengthAdjust="spacingAndGlyphs"
        clip-path="url(#${id})">${escapeXml(text)}</text>`;
  return { svg, end: begin + duration };
}

function render(user, aboutText) {
  const languages = topLanguages(user.repositories);
  const streak = computeStreak(user.contributionsCollection.contributionCalendar);
  const uptimeDays = daysSince(user.createdAt);
  // Each about line gets its own <text> (instead of tspans in one block) so
  // it can be typed independently with the same reveal mechanism as every
  // other line — this also avoids tspan/animate interaction quirks some SVG
  // renderers have with multi-line text blocks.
  const aboutLines = wrapText(aboutText, 74).slice(0, 4);

  const statRows = [
    ["uptime", `${uptimeDays}d`],
    ["repos", `${user.repositories.totalCount}`],
    ["followers/following", `${user.followers.totalCount} / ${user.following.totalCount}`],
    ["streak", `${streak.current}d current / ${streak.longest}d longest`],
  ];

  const parts = [];
  let t = 0.4;
  let idSeq = 0;
  const nextId = (prefix) => `${prefix}-${idSeq++}`;

  // whoami -> name
  const whoami = typeLine({
    text: "guest@terminalexplore:~$ whoami",
    x: 40,
    y: 46,
    fontSize: 14,
    opacity: 0.4,
    begin: t,
    id: nextId("type"),
  });
  parts.push(whoami.svg);
  t = whoami.end + 0.18;

  const name = typeLine({
    text: user.name || user.login,
    x: 40,
    y: 72,
    fontSize: 18,
    weight: 700,
    opacity: 1,
    begin: t,
    id: nextId("type"),
  });
  parts.push(name.svg);
  t = name.end + 0.3;

  parts.push(`<line x1="40" y1="94" x2="640" y2="94" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />`);

  // stats: type each label, then its value, row by row
  statRows.forEach(([label, value], rowIndex) => {
    const y = 122 + rowIndex * 24;
    const lbl = typeLine({
      text: label,
      x: 40,
      y,
      fontSize: 12,
      opacity: 0.45,
      begin: t,
      id: nextId("type"),
      speed: 0.02,
      maxDur: 0.45,
    });
    parts.push(lbl.svg);
    t = lbl.end + 0.06;

    const val = typeLine({
      text: value,
      x: 640,
      y,
      fontSize: 12,
      opacity: 1,
      begin: t,
      id: nextId("type"),
      anchorEnd: true,
      speed: 0.022,
      maxDur: 0.55,
    });
    parts.push(val.svg);
    t = val.end + 0.16;
  });
  t += 0.1;

  parts.push(`<line x1="40" y1="216" x2="640" y2="216" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />`);

  // languages: type header, then per language: name -> bar fill -> percent
  const langHeader = typeLine({
    text: "languages (live via github api)",
    x: 40,
    y: 242,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.02,
    maxDur: 0.9,
  });
  parts.push(langHeader.svg);
  t = langHeader.end + 0.2;

  languages.forEach((lang, i) => {
    const y = 266 + i * 24;
    const nameEl = typeLine({
      text: lang.name,
      x: 40,
      y,
      fontSize: 12,
      opacity: 1,
      begin: t,
      id: nextId("type"),
      speed: 0.025,
      maxDur: 0.4,
    });
    parts.push(nameEl.svg);
    t = nameEl.end + 0.1;

    const fillWidth = (460 * lang.percent) / 100;
    const barBegin = t;
    const barDur = 0.6;
    parts.push(`
      <rect x="140" y="${y - 10}" width="460" height="8" rx="2" fill="#ffffff" opacity="0.1" />
      <rect x="140" y="${y - 10}" width="0" height="8" rx="2" fill="#ffffff" opacity="0.85">
        <animate attributeName="width" begin="${barBegin.toFixed(2)}s" dur="${barDur}s"
          calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1" values="0;${fillWidth.toFixed(2)}" fill="freeze" />
      </rect>`);
    t = barBegin + barDur + 0.08;

    const pctBegin = t;
    parts.push(
      `<text x="600" y="${y}" text-anchor="end" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0">${lang.percent}%<animate attributeName="opacity" begin="${pctBegin.toFixed(2)}s" dur="0.15s" values="0;1" fill="freeze" /></text>`
    );
    t = pctBegin + 0.15 + 0.14;
  });
  t += 0.1;

  parts.push(`<line x1="40" y1="336" x2="640" y2="336" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />`);

  // about.md: type command, then type each wrapped line
  const aboutCmd = typeLine({
    text: "cat about.md",
    x: 40,
    y: 362,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.025,
    maxDur: 0.45,
  });
  parts.push(aboutCmd.svg);
  t = aboutCmd.end + 0.2;

  aboutLines.forEach((line, i) => {
    const el = typeLine({
      text: line,
      x: 40,
      y: 390 + i * 20,
      fontSize: 13,
      opacity: 0.9,
      begin: t,
      id: nextId("type"),
      speed: 0.014,
      maxDur: 1.1,
    });
    parts.push(el.svg);
    t = el.end + 0.1;
  });
  t += 0.15;

  parts.push(`<line x1="40" y1="470" x2="640" y2="470" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />`);

  const footerPrompt = "guest@terminalexplore:~$ ";
  const cursorBegin = t;
  const cursorX = 40 + footerPrompt.length * (12 * 0.6);
  parts.push(`
    <text x="40" y="496" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0.35">${escapeXml(footerPrompt)}</text>
    <rect x="${cursorX.toFixed(2)}" y="484" width="7" height="14" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" begin="${cursorBegin.toFixed(2)}s" dur="1s" values="0;1;1;0;0" keyTimes="0;0.05;0.5;0.5;1" repeatCount="indefinite" />
    </rect>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 560">
  <rect width="680" height="560" rx="10" fill="#0a0a0a" />
  <rect width="680" height="560" rx="10" fill="#ffffff" opacity="0.015" />

  ${parts.join("\n")}
</svg>
`;
}

async function main() {
  const [user, aboutText] = await Promise.all([
    fetchProfile(),
    readFile(ABOUT_FILE, "utf8"),
  ]);
  const svg = render(user, aboutText);
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, svg, "utf8");
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
