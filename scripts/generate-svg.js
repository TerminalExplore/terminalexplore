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
function typeLine({ text, x, y, fontSize, opacity = 1, weight, begin, id }) {
  const charWidth = fontSize * 0.6;
  const fullWidth = text.length * charWidth;
  const duration = Math.max(text.length * TYPE_SPEED, 0.15);
  const steps = Math.max(text.length, 1);
  const values = [];
  const keyTimes = [];
  for (let i = 0; i <= steps; i++) {
    values.push(((fullWidth * i) / steps).toFixed(2));
    keyTimes.push((i / steps).toFixed(4));
  }
  const weightAttr = weight ? ` font-weight="${weight}"` : "";
  const svg = `
      <clipPath id="${id}">
        <rect x="${x - 2}" y="${y - fontSize}" height="${fontSize + 8}" width="0">
          <animate attributeName="width" begin="${begin.toFixed(2)}s" dur="${duration.toFixed(2)}s"
            calcMode="discrete" keyTimes="${keyTimes.join(";")}" values="${values.join(";")}" fill="freeze" />
        </rect>
      </clipPath>
      <text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${fontSize}"${weightAttr}
        fill="#ffffff" opacity="${opacity}" textLength="${fullWidth.toFixed(2)}" lengthAdjust="spacingAndGlyphs"
        clip-path="url(#${id})">${escapeXml(text)}</text>`;
  return { svg, end: begin + duration };
}

function render(user, aboutText) {
  const languages = topLanguages(user.repositories);
  const streak = computeStreak(user.contributionsCollection.contributionCalendar);
  const uptimeDays = daysSince(user.createdAt);
  const aboutLines = wrapText(aboutText, 74).slice(0, 5);

  const statRows = [
    ["uptime", `${uptimeDays}d`],
    ["repos", `${user.repositories.totalCount}`],
    ["followers/following", `${user.followers.totalCount} / ${user.following.totalCount}`],
    ["streak", `${streak.current}d current / ${streak.longest}d longest`],
  ];

  const statsSvg = statRows
    .map(
      ([label, value], i) => `
      <text x="40" y="${122 + i * 24}" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0.45">${escapeXml(label)}</text>
      <text x="640" y="${122 + i * 24}" text-anchor="end" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="1">${escapeXml(value)}</text>`
    )
    .join("\n");

  const barsSvg = languages
    .map((lang, i) => {
      const y = 266 + i * 24;
      const fillWidth = (460 * lang.percent) / 100;
      return `
      <text x="40" y="${y}" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="1">${escapeXml(lang.name)}</text>
      <rect x="140" y="${y - 10}" width="460" height="8" rx="2" fill="#ffffff" opacity="0.1" />
      <rect x="140" y="${y - 10}" width="${fillWidth.toFixed(2)}" height="8" rx="2" fill="#ffffff" opacity="0.85" />
      <text x="600" y="${y}" text-anchor="end" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0.6">${lang.percent}%</text>`;
    })
    .join("\n");

  // Boot sequence: type "whoami" -> reveal name -> type "cat about.md" -> reveal about text.
  let t = 0.4;
  const whoami = typeLine({
    text: "guest@terminalexplore:~$ whoami",
    x: 40,
    y: 46,
    fontSize: 14,
    opacity: 0.4,
    begin: t,
    id: "type-whoami",
  });
  t = whoami.end + 0.2;

  const nameBegin = t;
  const nameText = user.name || user.login;
  const nameSvg = `<text x="40" y="72" font-family="${FONT_STACK}" font-size="18" font-weight="700" fill="#ffffff" opacity="0">${escapeXml(nameText)}<animate attributeName="opacity" begin="${nameBegin.toFixed(2)}s" dur="0.3s" values="0;1" fill="freeze" /></text>`;
  t = nameBegin + 0.3 + 0.3;

  const aboutCmd = typeLine({
    text: "cat about.md",
    x: 40,
    y: 362,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: "type-about-cmd",
  });
  t = aboutCmd.end + 0.2;

  const aboutBegin = t;
  const aboutSvg = aboutLines.length
    ? `<text x="40" y="390" font-family="${FONT_STACK}" font-size="13" fill="#ffffff" opacity="0">${aboutLines
        .map((line, i) => `<tspan x="40" dy="${i === 0 ? 0 : 20}">${escapeXml(line)}</tspan>`)
        .join("")}<animate attributeName="opacity" begin="${aboutBegin.toFixed(2)}s" dur="0.4s" values="0;1" fill="freeze" /></text>`
    : "";
  t = aboutBegin + 0.4 + 0.3;

  const cursorBegin = t;
  const footerPrompt = "guest@terminalexplore:~$ ";
  const cursorX = 40 + footerPrompt.length * (12 * 0.6);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 560">
  <rect width="680" height="560" rx="10" fill="#0a0a0a" />
  <rect width="680" height="560" rx="10" fill="#ffffff" opacity="0.015" />

  ${whoami.svg}
  ${nameSvg}
  <line x1="40" y1="94" x2="640" y2="94" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />

  ${statsSvg}
  <line x1="40" y1="216" x2="640" y2="216" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />

  <text x="40" y="242" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0.45">languages (live via github api)</text>
  ${barsSvg}
  <line x1="40" y1="336" x2="640" y2="336" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />

  ${aboutCmd.svg}
  ${aboutSvg}
  <line x1="40" y1="470" x2="640" y2="470" stroke="#ffffff" stroke-width="0.5" opacity="0.12" />

  <text x="40" y="496" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0.35">${escapeXml(footerPrompt)}</text>
  <rect x="${cursorX.toFixed(2)}" y="484" width="7" height="14" fill="#ffffff" opacity="0">
    <animate attributeName="opacity" begin="${cursorBegin.toFixed(2)}s" dur="1s" values="0;1;1;0;0" keyTimes="0;0.05;0.5;0.5;1" repeatCount="indefinite" />
  </rect>
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
