// Generates an animated "terminal" SVG for the GitHub profile README.
// Pulls live data about the user via the GitHub GraphQL API and renders
// it as a typewriter animation inside a fake terminal window.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const USERNAME = process.env.GH_USERNAME || "TerminalExplore";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT_FILE = path.join("assets", "terminal.svg");

if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN environment variable.");
  process.exit(1);
}

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      name
      login
      bio
      createdAt
      followers {
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
          stargazerCount
          languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
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
          totalContributions
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

function topLanguages(repositories, limit = 5) {
  const bytesByLanguage = new Map();
  for (const repo of repositories.nodes) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      bytesByLanguage.set(name, (bytesByLanguage.get(name) || 0) + edge.size);
    }
  }
  return [...bytesByLanguage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function totalStars(repositories) {
  return repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
}

function yearsSince(dateString) {
  const ms = Date.now() - new Date(dateString).getTime();
  return (ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildLines(user) {
  const languages = topLanguages(user.repositories);
  const stars = totalStars(user.repositories);
  const contributions = user.contributionsCollection.contributionCalendar.totalContributions;

  const lines = [];
  lines.push({ type: "prompt", text: "whoami" });
  lines.push({ type: "output", text: user.name || user.login, color: "#f8f8f2" });

  if (user.bio) {
    lines.push({ type: "prompt", text: "cat about.txt" });
    lines.push({ type: "output", text: user.bio, color: "#f8f8f2" });
  }

  lines.push({ type: "prompt", text: "ls stack/" });
  lines.push({
    type: "output",
    text: languages.length ? languages.join("  ") : "—",
    color: "#8be9fd",
  });

  lines.push({ type: "prompt", text: "stats --summary" });
  lines.push({
    type: "output",
    text: `repos:${user.repositories.totalCount}  stars:${stars}  followers:${user.followers.totalCount}  contributions(1y):${contributions}`,
    color: "#f1fa8c",
  });

  lines.push({ type: "prompt", text: `uptime --since ${new Date(user.createdAt).getFullYear()}` });
  lines.push({
    type: "output",
    text: `on GitHub for ${yearsSince(user.createdAt)} years`,
    color: "#bd93f9",
  });

  return lines;
}

const FONT_SIZE = 14;
const CHAR_WIDTH = FONT_SIZE * 0.6;
const LINE_HEIGHT = 26;
const PADDING_X = 24;
const PADDING_TOP = 56;
const WINDOW_WIDTH = 720;
const HEADER_HEIGHT = 40;
const TYPE_SPEED = 0.045; // seconds per character
const LINE_GAP = 0.35; // pause between lines
const PROMPT = "guest@terminalexplore:~$ ";

function renderTypedLine(line, index, startTime) {
  const isPrompt = line.type === "prompt";
  const fullText = isPrompt ? `${PROMPT}${line.text}` : line.text;
  const color = isPrompt ? "#50fa7b" : line.color || "#f8f8f2";
  const y = PADDING_TOP + index * LINE_HEIGHT;
  const duration = Math.max(fullText.length * TYPE_SPEED, 0.1);
  const fullWidth = fullText.length * CHAR_WIDTH + 4;

  const steps = Math.max(fullText.length, 1);
  const values = [];
  const keyTimes = [];
  for (let i = 0; i <= steps; i++) {
    values.push(((fullWidth * i) / steps).toFixed(2));
    keyTimes.push((i / steps).toFixed(4));
  }

  const clipId = `clip-${index}`;

  const markup = `
    <clipPath id="${clipId}">
      <rect x="0" y="${y - FONT_SIZE}" height="${LINE_HEIGHT}" width="0">
        <animate attributeName="width" begin="${startTime.toFixed(2)}s" dur="${duration.toFixed(2)}s"
          calcMode="discrete"
          keyTimes="${keyTimes.join(";")}"
          values="${values.join(";")}"
          fill="freeze" />
      </rect>
    </clipPath>
    <text x="${PADDING_X}" y="${y}" font-family="'Fira Code', Consolas, Menlo, monospace"
      font-size="${FONT_SIZE}" fill="${color}" clip-path="url(#${clipId})">${escapeXml(fullText)}</text>
  `;

  return { markup, endTime: startTime + duration };
}

function render(user) {
  const lines = buildLines(user);
  let time = 0.6;
  const rendered = [];
  for (let i = 0; i < lines.length; i++) {
    const { markup, endTime } = renderTypedLine(lines[i], i, time);
    rendered.push(markup);
    time = endTime + LINE_GAP;
  }

  const height = PADDING_TOP + (lines.length + 1) * LINE_HEIGHT + 8;
  const finalY = PADDING_TOP + lines.length * LINE_HEIGHT;
  const cursorX = PADDING_X + PROMPT.length * CHAR_WIDTH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WINDOW_WIDTH}" height="${height}" viewBox="0 0 ${WINDOW_WIDTH} ${height}">
  <rect width="${WINDOW_WIDTH}" height="${height}" rx="10" fill="#282a36" />
  <rect width="${WINDOW_WIDTH}" height="${HEADER_HEIGHT}" rx="10" fill="#44475a" />
  <rect y="${HEADER_HEIGHT - 10}" width="${WINDOW_WIDTH}" height="10" fill="#44475a" />
  <circle cx="20" cy="${HEADER_HEIGHT / 2}" r="6" fill="#ff5555" />
  <circle cx="40" cy="${HEADER_HEIGHT / 2}" r="6" fill="#f1fa8c" />
  <circle cx="60" cy="${HEADER_HEIGHT / 2}" r="6" fill="#50fa7b" />
  <text x="${WINDOW_WIDTH / 2}" y="${HEADER_HEIGHT / 2 + 4}" text-anchor="middle"
    font-family="Consolas, Menlo, monospace" font-size="12" fill="#f8f8f2">guest@terminalexplore: ~</text>
  ${rendered.join("\n")}
  <text x="${PADDING_X}" y="${finalY}" font-family="'Fira Code', Consolas, Menlo, monospace"
    font-size="${FONT_SIZE}" fill="#50fa7b" opacity="0">${escapeXml(PROMPT)}<animate attributeName="opacity" begin="${time.toFixed(2)}s" dur="0.1s" values="0;1" fill="freeze" /></text>
  <rect x="${cursorX}" y="${finalY - FONT_SIZE}" width="${CHAR_WIDTH}" height="${LINE_HEIGHT - 6}" fill="#50fa7b" opacity="0">
    <animate attributeName="opacity" begin="${time.toFixed(2)}s" dur="1s" values="0;1;1;0;0" keyTimes="0;0.05;0.5;0.5;1" repeatCount="indefinite" />
  </rect>
</svg>
`;
}

async function main() {
  const user = await fetchProfile();
  const svg = render(user);
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, svg, "utf8");
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
