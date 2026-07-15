// Generates an animated "terminal" SVG for the GitHub profile README.
// Pure SMIL markup (no JS/script tags) so GitHub renders it as a plain,
// self-playing image. Data comes live from the GitHub GraphQL API.

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
      organizations(first: 6) {
        nodes {
          login
        }
      }
      repositories(
        first: 100
        ownerAffiliations: [OWNER]
        isFork: false
        privacy: PUBLIC
      ) {
        totalCount
        nodes {
          name
          stargazerCount
          pushedAt
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
      pinnedItems(first: 3, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            stargazerCount
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
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

// Grouped by month rather than by week: with ~52 weekly bars there's only
// ~11px per column, nowhere near enough to print a count underneath each
// one legibly. 12 monthly bars give each column ~50px, room for a real
// number label.
function monthlyCommitTotals(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const totalsByMonth = new Map();
  for (const d of days) {
    const key = d.date.slice(0, 7); // "YYYY-MM"
    totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + d.contributionCount);
  }
  return [...totalsByMonth.entries()].map(([key, total]) => {
    const [year, month] = key.split("-");
    const label = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    return { label, total };
  });
}

function commitSummary(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const total = days.reduce((sum, d) => sum + d.contributionCount, 0);
  const peak = days.reduce((best, d) => (d.contributionCount > best.contributionCount ? d : best), days[0]);
  return { total, peakDate: peak.date, peakCount: peak.contributionCount };
}

function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function featuredRepos(user, limit = 3) {
  const pinned = (user.pinnedItems?.nodes || []).filter(Boolean);
  const source = pinned.length ? pinned : user.repositories.nodes;
  return [...source]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, limit)
    .map((r) => ({ name: r.name, stars: r.stargazerCount }));
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
  // Count the current streak backwards from the most recent day. If today
  // has no contributions yet, that doesn't mean the streak is broken — the
  // day just isn't over. Give it a one-day grace and start counting from
  // yesterday instead; only actually reset to 0 if yesterday is also empty.
  let i = days.length - 1;
  if (days[i] && days[i].contributionCount === 0) {
    i--;
  }
  let current = 0;
  for (; i >= 0 && days[i].contributionCount > 0; i--) {
    current++;
  }
  return { current, longest };
}

function orgsSummary(user) {
  const orgs = (user.organizations?.nodes || []).map((o) => o.login);
  return orgs.length ? orgs.join(", ") : "none";
}

function lastPushSummary(user) {
  const repos = user.repositories.nodes.filter((r) => r.pushedAt);
  if (!repos.length) return "—";
  const latest = repos.reduce((a, b) => (new Date(a.pushedAt) > new Date(b.pushedAt) ? a : b));
  const days = daysSince(latest.pushedAt);
  const when = days <= 0 ? "today" : days === 1 ? "1d ago" : `${days}d ago`;
  return `${latest.name} · ${when}`;
}

function contributionBreakdown(cc) {
  return `${cc.totalCommitContributions} commits · ${cc.totalPullRequestContributions} prs · ${cc.totalIssueContributions} issues · ${cc.totalPullRequestReviewContributions} reviews`;
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

// Wraps each source line of about.txt independently (instead of collapsing
// the whole file into one paragraph) so intentional line breaks — like a
// signature line sitting on its own — survive, while any single long line
// still gets auto-wrapped to fit the card.
function wrapParagraphs(text, maxChars) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((paragraph) => wrapText(paragraph, maxChars));
}

// Finds a bare URL or "www." address in a line of text and returns an
// https:// href for it, or null if the line has no link in it.
function extractLink(line) {
  const match = line.match(/(https?:\/\/\S+|www\.\S+)/);
  if (!match) return null;
  const raw = match[1].replace(/[).,;:!?]+$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

const FONT_STACK = "'JetBrains Mono', monospace";
const TYPE_SPEED = 0.022; // seconds per character

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
  minDur = 0.08,
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

// Section separators fade in right as the boot sequence reaches them,
// instead of being visible on the very first frame.
function fadeLine(x1, y, x2, begin, dur = 0.15) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#ffffff" stroke-width="0.5" opacity="0">
      <animate attributeName="opacity" begin="${begin.toFixed(2)}s" dur="${dur}s" values="0;0.12" fill="freeze" />
    </line>`;
}

// Monthly commit-activity chart, monochrome to match the rest of the card
// (same white-on-black language as the stat/language bars). Bars reveal
// with a single left-to-right wipe instead of animating individually.
// Returns both the svg and the total extra height used below the baseline
// (count + month labels) so the caller can lay out what comes next.
function commitChart({ months, x, width, baselineY, height, begin, id }) {
  const max = Math.max(...months.map((m) => m.total), 1);
  const n = months.length;
  const pitch = width / n;
  const barWidth = Math.max(pitch * 0.5, 4);
  const radius = Math.min(barWidth / 2, 3);
  const labelBelowHeight = 26; // count line + month line

  const bars = months
    .map(({ label, total }, i) => {
      const barHeight = total === 0 ? 2 : Math.max((total / max) * height, 3);
      const barCenterX = x + i * pitch + pitch / 2;
      const barX = barCenterX - barWidth / 2;
      const barY = baselineY - barHeight;
      const barOpacity = total === 0 ? 0.12 : 0.85;
      const countOpacity = total === 0 ? 0.3 : 0.75;
      return `
        <rect x="${barX.toFixed(2)}" y="${barY.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="${radius.toFixed(2)}" fill="#ffffff" opacity="${barOpacity}" />
        <text x="${barCenterX.toFixed(2)}" y="${baselineY + 13}" text-anchor="middle" font-family="${FONT_STACK}" font-size="10" fill="#ffffff" opacity="${countOpacity}">${total}</text>
        <text x="${barCenterX.toFixed(2)}" y="${baselineY + 25}" text-anchor="middle" font-family="${FONT_STACK}" font-size="9" fill="#ffffff" opacity="0.3">${escapeXml(label)}</text>`;
    })
    .join("");

  const dur = 0.8;
  const svg = `
      <clipPath id="${id}">
        <rect x="${x}" y="${(baselineY - height - 4).toFixed(2)}" height="${height + labelBelowHeight + 8}" width="0">
          <animate attributeName="width" begin="${begin.toFixed(2)}s" dur="${dur}s"
            calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1" values="0;${width}" fill="freeze" />
        </rect>
      </clipPath>
      <g clip-path="url(#${id})">${bars}</g>`;
  return { svg, end: begin + dur, labelBelowHeight };
}

const BOOT_START = 0.35;

function render(user, aboutText) {
  const languages = topLanguages(user.repositories);
  const streak = computeStreak(user.contributionsCollection.contributionCalendar);
  const uptimeDays = daysSince(user.createdAt);
  // Each about line gets its own <text> (instead of tspans in one block) so
  // it can be typed independently with the same reveal mechanism as every
  // other line — this also avoids tspan/animate interaction quirks some SVG
  // renderers have with multi-line text blocks.
  const aboutLines = wrapParagraphs(aboutText, 74).slice(0, 4);

  const statRows = [
    ["uptime", `${uptimeDays}d`],
    ["repos", `${user.repositories.totalCount}`],
    ["followers/following", `${user.followers.totalCount} / ${user.following.totalCount}`],
    ["orgs", orgsSummary(user)],
    ["last push", lastPushSummary(user)],
    ["streak", `${streak.current}d current / ${streak.longest}d longest`],
    ["activity", contributionBreakdown(user.contributionsCollection)],
  ];

  const parts = [];
  let t = BOOT_START;
  let y = 46;
  let idSeq = 0;
  const nextId = (prefix) => `${prefix}-${idSeq++}`;

  // whoami -> name
  const whoami = typeLine({
    text: "root@terminalexplore:~$ whoami",
    x: 40,
    y,
    fontSize: 14,
    opacity: 0.4,
    begin: t,
    id: nextId("type"),
  });
  parts.push(whoami.svg);
  t = whoami.end + 0.1;
  y += 26;

  const name = typeLine({
    text: user.name || user.login,
    x: 40,
    y,
    fontSize: 18,
    weight: 700,
    opacity: 1,
    begin: t,
    id: nextId("type"),
  });
  parts.push(name.svg);
  t = name.end + 0.18;
  y += 22;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.1;
  y += 28;

  // stats: type each label, then its value, row by row
  statRows.forEach(([label, value]) => {
    const rowY = y;
    const lbl = typeLine({
      text: label,
      x: 40,
      y: rowY,
      fontSize: 12,
      opacity: 0.45,
      begin: t,
      id: nextId("type"),
      speed: 0.015,
      maxDur: 0.3,
    });
    parts.push(lbl.svg);
    t = lbl.end + 0.04;

    const val = typeLine({
      text: value,
      x: 640,
      y: rowY,
      fontSize: 12,
      opacity: 1,
      begin: t,
      id: nextId("type"),
      anchorEnd: true,
      speed: 0.016,
      maxDur: 0.5,
    });
    parts.push(val.svg);
    t = val.end + 0.09;
    y += 24;
  });
  t += 0.06;
  y += 4;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.1;
  y += 26;

  // about.md: type command, then type each wrapped line
  const aboutCmd = typeLine({
    text: "cat about.md",
    x: 40,
    y,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.018,
    maxDur: 0.3,
  });
  parts.push(aboutCmd.svg);
  t = aboutCmd.end + 0.12;
  y += 28;

  aboutLines.forEach((line) => {
    const el = typeLine({
      text: line,
      x: 40,
      y,
      fontSize: 13,
      opacity: 0.9,
      begin: t,
      id: nextId("type"),
      speed: 0.01,
      maxDur: 0.7,
    });
    // Only actually clickable if the SVG is opened as its own document
    // (e.g. GitHub's "open raw image" view) — an <img>-embedded SVG in the
    // README can't be clicked into, that's an HTML limitation, not this file.
    const href = extractLink(line);
    parts.push(href ? `<a href="${escapeXml(href)}" target="_blank" rel="noopener noreferrer">${el.svg}</a>` : el.svg);
    t = el.end + 0.06;
    y += 20;
  });
  t += 0.1;
  y += 8;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.1;
  y += 26;

  // languages: type header, then per language: name -> bar fill -> percent
  const langHeader = typeLine({
    text: "languages (live via github api)",
    x: 40,
    y,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.015,
    maxDur: 0.55,
  });
  parts.push(langHeader.svg);
  t = langHeader.end + 0.12;
  y += 24;

  languages.forEach((lang) => {
    const rowY = y;
    const nameEl = typeLine({
      text: lang.name,
      x: 40,
      y: rowY,
      fontSize: 12,
      opacity: 1,
      begin: t,
      id: nextId("type"),
      speed: 0.018,
      maxDur: 0.28,
    });
    parts.push(nameEl.svg);
    t = nameEl.end + 0.06;

    // Bar track stops short of the 640 right margin (matching the stat
    // values above) so the percentage label never overlaps a near-full bar.
    const barTrackWidth = 440;
    const fillWidth = (barTrackWidth * lang.percent) / 100;
    const trackBegin = t;
    parts.push(`
      <rect x="140" y="${rowY - 10}" width="${barTrackWidth}" height="8" rx="2" fill="#ffffff" opacity="0">
        <animate attributeName="opacity" begin="${trackBegin.toFixed(2)}s" dur="0.1s" values="0;0.1" fill="freeze" />
      </rect>`);
    const barBegin = trackBegin + 0.06;
    const barDur = 0.35;
    parts.push(`
      <rect x="140" y="${rowY - 10}" width="0" height="8" rx="2" fill="#ffffff" opacity="0.85">
        <animate attributeName="width" begin="${barBegin.toFixed(2)}s" dur="${barDur}s"
          calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1" values="0;${fillWidth.toFixed(2)}" fill="freeze" />
      </rect>`);
    t = barBegin + barDur + 0.05;

    const pctBegin = t;
    parts.push(
      `<text x="640" y="${rowY}" text-anchor="end" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0">${lang.percent}%<animate attributeName="opacity" begin="${pctBegin.toFixed(2)}s" dur="0.1s" values="0;1" fill="freeze" /></text>`
    );
    t = pctBegin + 0.1 + 0.08;
    y += 24;
  });
  t += 0.06;
  y += 4;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.12;
  y += 26;

  // commit activity: type command, then a totals/peak-day summary line,
  // then wipe-reveal the monthly bar chart
  const commitCmd = typeLine({
    text: "git log --graph --since=1y",
    x: 40,
    y,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.015,
    maxDur: 0.45,
  });
  parts.push(commitCmd.svg);
  t = commitCmd.end + 0.1;
  y += 24;

  const summary = commitSummary(user.contributionsCollection.contributionCalendar);
  const summaryText =
    summary.peakCount > 0
      ? `${summary.total} commits this year · busiest ${formatShortDate(summary.peakDate)} (${summary.peakCount})`
      : `${summary.total} commits this year`;
  const summaryLine = typeLine({
    text: summaryText,
    x: 40,
    y,
    fontSize: 12,
    opacity: 1,
    begin: t,
    id: nextId("type"),
    speed: 0.013,
    maxDur: 0.55,
  });
  parts.push(summaryLine.svg);
  t = summaryLine.end + 0.12;
  y += 26;

  const chartHeight = 50;
  const chartBaselineY = y + chartHeight;
  parts.push(fadeLine(40, chartBaselineY + 0.5, 640, t, 0.1));
  const chart = commitChart({
    months: monthlyCommitTotals(user.contributionsCollection.contributionCalendar),
    x: 40,
    width: 600,
    baselineY: chartBaselineY,
    height: chartHeight,
    begin: t,
    id: nextId("chart"),
  });
  parts.push(chart.svg);
  t = chart.end + 0.12;
  y = chartBaselineY + chart.labelBelowHeight + 14;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.1;
  y += 26;

  // featured repositories: pinned repos if set, otherwise top-starred owned repos
  const repos = featuredRepos(user);
  const reposHeader = typeLine({
    text: "featured repositories",
    x: 40,
    y,
    fontSize: 12,
    opacity: 0.45,
    begin: t,
    id: nextId("type"),
    speed: 0.015,
    maxDur: 0.4,
  });
  parts.push(reposHeader.svg);
  t = reposHeader.end + 0.12;
  y += 24;

  repos.forEach((repo) => {
    const rowY = y;
    const nameEl = typeLine({
      text: repo.name,
      x: 40,
      y: rowY,
      fontSize: 12,
      opacity: 1,
      begin: t,
      id: nextId("type"),
      speed: 0.016,
      maxDur: 0.32,
    });
    const repoHref = `https://github.com/${USERNAME}/${repo.name}`;
    parts.push(`<a href="${escapeXml(repoHref)}" target="_blank" rel="noopener noreferrer">${nameEl.svg}</a>`);
    t = nameEl.end + 0.05;

    const starsEl = typeLine({
      text: `★ ${repo.stars}`,
      x: 640,
      y: rowY,
      fontSize: 12,
      opacity: 0.6,
      begin: t,
      id: nextId("type"),
      anchorEnd: true,
      speed: 0.02,
      maxDur: 0.22,
    });
    parts.push(starsEl.svg);
    t = starsEl.end + 0.09;
    y += 24;
  });
  t += 0.06;
  y += 4;

  parts.push(fadeLine(40, y, 640, t));
  t += 0.12;
  y += 26;

  const footerY = y;
  const footerPrompt = "root@terminalexplore:~$ ";
  const footerBegin = t;
  const cursorBegin = footerBegin + 0.15;
  const cursorX = 40 + footerPrompt.length * (12 * 0.6);
  parts.push(`
    <text x="40" y="${footerY}" font-family="${FONT_STACK}" font-size="12" fill="#ffffff" opacity="0">${escapeXml(footerPrompt)}<animate attributeName="opacity" begin="${footerBegin.toFixed(2)}s" dur="0.15s" values="0;0.35" fill="freeze" /></text>
    <rect x="${cursorX.toFixed(2)}" y="${footerY - 12}" width="7" height="14" fill="#ffffff" opacity="0">
      <animate attributeName="opacity" begin="${cursorBegin.toFixed(2)}s" dur="1s" values="0;1;1;0;0" keyTimes="0;0.05;0.5;0.5;1" repeatCount="indefinite" />
    </rect>`);

  const totalHeight = footerY + 44;

  // Pure black panel: no wash, no border tint — just #000000.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 ${totalHeight}">
  <rect width="680" height="${totalHeight}" rx="10" fill="#000000" />

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
