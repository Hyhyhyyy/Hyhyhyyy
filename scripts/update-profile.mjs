import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputs = {
  stats: resolve(root, "assets", "stats.svg"),
  activity: resolve(root, "assets", "activity-stats.svg"),
  languages: resolve(root, "assets", "languages.svg"),
  heatmap: resolve(root, "assets", "tomato-heatmap.svg"),
  heatmapMobile: resolve(root, "assets", "tomato-heatmap-mobile.svg"),
};
const username = process.env.PROFILE_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || "Hyhyhyyy";
const token = process.env.GITHUB_TOKEN;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${username}-profile-archive`,
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) headers.Authorization = `Bearer ${token}`;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 240)}`);
  }
  return response.json();
}

async function githubGraphql(query, variables) {
  if (!token) throw new Error("GITHUB_TOKEN is required to generate the contribution heatmap.");
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(`GitHub GraphQL: ${JSON.stringify(payload.errors || payload).slice(0, 300)}`);
  }
  return payload.data;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function render({ repositories, stars, language, updated }) {
  const values = [repositories, stars, language, updated].map(escapeXml);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="168" viewBox="0 0 1000 168" role="img" aria-labelledby="title desc">
  <title id="title">Hyhyhyyy 的公开 GitHub 数据</title>
  <desc id="desc">${values[0]} 个原创公开仓库，${values[1]} 个星标，主要语言 ${values[2]}，最近更新于 ${values[3]}。</desc>
  <style>:root{--card:#f6f8fa;--border:#d0d7de;--fg:#1f2328;--muted:#656d76}text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}.serif{font-family:Georgia,"Noto Serif SC","Microsoft YaHei",serif}.fg{fill:var(--fg)}.muted{fill:var(--muted)}@media(prefers-color-scheme:dark){:root{--card:#0d1117;--border:#30363d;--fg:#e6edf3;--muted:#8b949e}}</style>
  <rect x="1" y="1" width="998" height="166" rx="6" fill="var(--card)" stroke="var(--border)"/>
  <g transform="translate(950 27)"><circle r="12" fill="#ff5a3c"/><path d="M-7-9l5 1 2-7 3 7 7-2-5 5-6-1-5 3z" fill="#72c45c"/></g>
  <path d="M250 32v103M500 32v103M750 32v103" stroke="var(--border)"/>
  <text class="muted" x="39" y="32" font-size="9" letter-spacing="2">README METRICS · LIVE</text>
  <g text-anchor="middle">
    <text class="serif fg" x="125" y="91" font-size="31" font-weight="700">${values[0]}</text>
    <text class="muted" x="125" y="119" font-size="11" letter-spacing="1.5">原创公开仓库</text>
    <text class="serif" x="375" y="91" font-size="31" font-weight="700" fill="#ff5a3c">${values[1]}</text>
    <text class="muted" x="375" y="119" font-size="11" letter-spacing="1.5">获得 STARS</text>
    <text class="serif fg" x="625" y="91" font-size="25" font-weight="700">${values[2]}</text>
    <text class="muted" x="625" y="119" font-size="11" letter-spacing="1.5">主要语言</text>
    <text class="serif fg" x="875" y="91" font-size="20" font-weight="700">${values[3]}</text>
    <text class="muted" x="875" y="119" font-size="11" letter-spacing="1.5">最近更新</text>
  </g>
</svg>
`;
}

function renderActivityStats({ stars, commits, pullRequests, issues, repositories, activeDays }) {
  const rows = [
    ["★", "Total stars earned", stars],
    ["↻", "Commits · last year", commits],
    ["⑂", "Pull requests · last year", pullRequests],
    ["!", "Issues · last year", issues],
    ["▣", "Original public repositories", repositories],
  ];
  const rowSvg = rows.map(([icon, label, value], index) => {
    const y = 90 + index * 39;
    return `<text x="38" y="${y}" font-size="22" fill="#4493f8">${icon}</text><text class="label" x="78" y="${y}" font-size="15" font-weight="600">${escapeXml(label)}</text><text class="value" x="330" y="${y}" font-size="16" font-weight="700">${escapeXml(value)}</text>`;
  }).join("");
  const circumference = 2 * Math.PI * 58;
  const progress = Math.min(1, activeDays / 365) * circumference;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" role="img" aria-labelledby="title desc">
  <title id="title">Hyhyhyyy GitHub activity</title><desc id="desc">Public GitHub activity during the last year and current original public repositories.</desc>
  <style>:root{--bg:#fff;--border:#d0d7de;--fg:#385d7a;--muted:#6e8aa1}.label,.value,.title{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;fill:var(--fg)}.muted{fill:var(--muted)}@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--border:#30363d;--fg:#c9d1d9;--muted:#8b949e}}</style>
  <rect x="1" y="1" width="598" height="298" rx="8" fill="var(--bg)" stroke="var(--border)"/>
  <text class="title" x="38" y="48" font-size="23" font-weight="700">Hyhyhyyy&apos;s GitHub Activity</text>
  ${rowSvg}
  <g transform="translate(495 155) rotate(-90)"><circle r="58" fill="none" stroke="var(--border)" stroke-width="10"/><circle r="58" fill="none" stroke="#78a6c8" stroke-width="10" stroke-linecap="round" stroke-dasharray="${progress.toFixed(1)} ${circumference.toFixed(1)}"/></g>
  <text class="value" x="495" y="155" text-anchor="middle" font-size="28" font-weight="700">${activeDays}</text><text class="muted" x="495" y="178" text-anchor="middle" font-size="11">ACTIVE DAYS</text>
  <text class="muted" x="38" y="279" font-size="10">PUBLIC DATA · AUTOMATIC DAILY REFRESH</text>
</svg>
`;
}

const languageColors = {
  Python: "#3572A5", TypeScript: "#3178C6", JavaScript: "#f1e05a", Kotlin: "#A97BFF",
  Java: "#b07219", HTML: "#e34c26", CSS: "#663399", Shell: "#89e051", PowerShell: "#012456",
  C: "#555555", "C++": "#f34b7d", R: "#198CE7", Go: "#00ADD8", Vue: "#41b883",
};

function renderLanguages(languageBytes) {
  const entries = [...languageBytes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  let offset = 0;
  const segments = entries.map(([name, bytes]) => {
    const width = bytes / total * 330;
    const segment = `<rect x="${38 + offset}" y="67" width="${Math.max(width, 1).toFixed(1)}" height="10" fill="${languageColors[name] || "#8b949e"}"/>`;
    offset += width;
    return segment;
  }).join("");
  const labels = entries.map(([name, bytes], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 38 + column * 190;
    const y = 112 + row * 43;
    const percentage = (bytes / total * 100).toFixed(1);
    return `<circle cx="${x + 7}" cy="${y - 5}" r="6" fill="${languageColors[name] || "#8b949e"}"/><text class="label" x="${x + 22}" y="${y}" font-size="14">${escapeXml(name)} ${percentage}%</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" role="img" aria-labelledby="title desc">
  <title id="title">Most used languages</title><desc id="desc">Language percentages by code bytes in original, public, non-archived repositories. This is not a skill ranking.</desc>
  <style>:root{--bg:#fff;--border:#d0d7de;--fg:#385d7a;--muted:#6e8aa1}.label,.title{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;fill:var(--fg)}.muted{fill:var(--muted)}@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--border:#30363d;--fg:#c9d1d9;--muted:#8b949e}}</style>
  <rect x="1" y="1" width="398" height="298" rx="8" fill="var(--bg)" stroke="var(--border)"/>
  <text class="title" x="38" y="48" font-size="23" font-weight="700">Most Used Languages</text>
  <clipPath id="bar"><rect x="38" y="67" width="330" height="10" rx="5"/></clipPath><g clip-path="url(#bar)">${segments}</g>
  ${labels}
  <text class="muted" x="38" y="279" font-size="9">BY PUBLIC REPOSITORY BYTES · NOT A SKILL RANKING</text>
</svg>
`;
}

const ripeness = {
  NONE: "#d8dee4",
  FIRST_QUARTILE: "#72d56a",
  SECOND_QUARTILE: "#fff04a",
  THIRD_QUARTILE: "#ff9a3d",
  FOURTH_QUARTILE: "#ff4d35",
};

function renderHeatmap(weeks, mobile = false) {
  const visible = weeks.slice(mobile ? -17 : -40);
  const cell = mobile ? 14 : 16;
  const gap = mobile ? 4 : 5;
  const startX = mobile ? 28 : 126;
  const startY = mobile ? 72 : 62;
  const width = mobile ? 390 : 1000;
  const height = mobile ? 245 : 260;
  const cells = visible.flatMap((week, column) =>
    week.contributionDays.map((day, row) => {
      const x = startX + column * (cell + gap);
      const y = startY + row * (cell + gap);
      const title = `${escapeXml(day.date)}: ${day.contributionCount} contributions`;
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${mobile ? 4 : 5}" fill="${ripeness[day.contributionLevel] || ripeness.NONE}"><title>${title}</title></rect>`;
    }),
  ).join("");
  const total = visible.reduce(
    (sum, week) => sum + week.contributionDays.reduce((weekSum, day) => weekSum + day.contributionCount, 0),
    0,
  );
  const subtitle = mobile ? "RECENT 17 WEEKS" : "REAL CONTRIBUTIONS / RECENT 40 WEEKS";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Tomato ripeness contribution heatmap</title><desc id="desc">${total} contributions visualized from green to ripe tomato red.</desc>
  <style>:root{--bg:#fff7d1;--border:#172b39;--fg:#172b39;--muted:#65717a}text{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.fg{fill:var(--fg)}.muted{fill:var(--muted)}.ripe{transform-box:fill-box;transform-origin:center;animation:p 2.8s ease-in-out infinite}@keyframes p{50%{transform:scale(.8);opacity:.72}}@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--border:#30363d;--fg:#f0f6fc;--muted:#8b949e}}@media(prefers-reduced-motion:reduce){.ripe{animation:none}}</style>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" fill="var(--bg)" stroke="var(--border)"/>
  <circle cx="${mobile ? 20 : 28}" cy="26" r="6" fill="#ff4d35"/><text class="fg" x="${mobile ? 33 : 43}" y="31" font-size="${mobile ? 10 : 13}" font-weight="700">TOMATO RIPENESS MATRIX</text><text class="muted" x="${mobile ? 250 : 760}" y="30" font-size="${mobile ? 7 : 10}">${subtitle}</text>
  ${cells}
  <text class="muted" x="${startX}" y="${height - 20}" font-size="${mobile ? 8 : 10}">${total} CONTRIBUTIONS</text>
  <g transform="translate(${mobile ? 235 : 735} ${height - 31})"><text class="muted" x="0" y="10" font-size="${mobile ? 7 : 9}">GROW</text><rect x="${mobile ? 36 : 48}" width="12" height="12" rx="3" fill="#72d56a"/><rect x="${mobile ? 52 : 65}" width="12" height="12" rx="3" fill="#fff04a"/><rect x="${mobile ? 68 : 82}" width="12" height="12" rx="3" fill="#ff9a3d"/><rect class="ripe" x="${mobile ? 84 : 99}" width="12" height="12" rx="3" fill="#ff4d35"/><text class="muted" x="${mobile ? 102 : 118}" y="10" font-size="${mobile ? 7 : 9}">RIPE</text></g>
</svg>
`;
}

async function writeIfChanged(output, content) {
  let previous = "";
  try {
    previous = await readFile(output, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (previous === content) return false;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, content, "utf8");
  return true;
}

async function main() {
  const repos = await github(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
  const original = repos.filter((repo) => !repo.fork && !repo.archived);
  const stars = original.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const languages = new Map();

  for (const repo of original) {
    if (repo.language) languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
  }

  const language =
    [...languages.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "Exploring";
  const updated = formatDate(original[0]?.pushed_at || new Date());
  const languageResponses = await Promise.all(
    original.map((repo) => github(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`)),
  );
  const languageBytes = new Map();
  for (const response of languageResponses) {
    for (const [name, bytes] of Object.entries(response)) {
      languageBytes.set(name, (languageBytes.get(name) || 0) + bytes);
    }
  }
  const contributionData = await githubGraphql(
    `query($login:String!){user(login:$login){contributionsCollection{totalCommitContributions totalIssueContributions totalPullRequestContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`,
    { login: username },
  );
  const collection = contributionData.user.contributionsCollection;
  const weeks = collection.contributionCalendar.weeks;
  const activeDays = weeks.flatMap((week) => week.contributionDays).filter((day) => day.contributionCount > 0).length;
  const generated = [
    [outputs.stats, render({ repositories: original.length, stars, language, updated })],
    [outputs.activity, renderActivityStats({
      stars,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      repositories: original.length,
      activeDays,
    })],
    [outputs.languages, renderLanguages(languageBytes)],
    [outputs.heatmap, renderHeatmap(weeks)],
    [outputs.heatmapMobile, renderHeatmap(weeks, true)],
  ];
  const changed = [];
  for (const [output, content] of generated) {
    if (await writeIfChanged(output, content)) changed.push(output);
  }
  console.log(changed.length ? `Updated ${changed.join(", ")}` : "Profile visuals are already current.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
