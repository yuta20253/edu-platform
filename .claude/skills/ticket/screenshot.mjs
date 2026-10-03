// /ticket skill 用のスクリーンショット撮影スクリプト
// 使い方: node .claude/skills/ticket/screenshot.mjs <url> [<url> ...]
// 環境変数:
//   SS_EMAIL / SS_PASSWORD : 指定時は /login でログインしてから撮影する
//   SS_BASE_URL            : ログイン画面のベースURL（デフォルト http://localhost:3000）
//   SS_WIDTH / SS_HEIGHT   : ビューポートサイズ（デフォルト 1280x800）
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("usage: node screenshot.mjs <url> [<url> ...]");
  process.exit(1);
}

const loadPlaywright = () => {
  // リポジトリ直下 / frontend 配下 / グローバルの順に解決を試みる
  const bases = [process.cwd(), path.join(process.cwd(), "frontend")];
  try {
    bases.push(execSync("npm root -g", { encoding: "utf8" }).trim());
  } catch {
    // npm が無い環境ではグローバル解決をスキップ
  }
  for (const base of bases) {
    try {
      return createRequire(path.join(base, "noop.js"))("playwright");
    } catch {
      // 次の候補を試す
    }
  }
  console.error(
    "playwright が見つかりません。`npm i -D playwright && npx playwright install chromium` を実行してください。",
  );
  process.exit(1);
};

const { chromium } = loadPlaywright();

const git = (cmd) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
const root = git("rev-parse --show-toplevel");
const branch = git("rev-parse --abbrev-ref HEAD").replace(/\//g, "_");
const outDir = path.join(root, ".claude", "screenshots", branch);
mkdirSync(outDir, { recursive: true });

const baseUrl = process.env.SS_BASE_URL ?? "http://localhost:3000";
const viewport = {
  width: Number(process.env.SS_WIDTH ?? 1280),
  height: Number(process.env.SS_HEIGHT ?? 800),
};

const fileNameFor = (url) => {
  const { pathname } = new URL(url);
  const name = pathname.replace(/^\/|\/$/g, "").replace(/[^\w-]+/g, "_");
  return `${name || "index"}.png`;
};

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  if (process.env.SS_EMAIL && process.env.SS_PASSWORD) {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', process.env.SS_EMAIL);
    await page.fill('input[name="password"]', process.env.SS_PASSWORD);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login")),
      page.click('button[type="submit"]'),
    ]);
  }

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle" });
    const file = path.join(outDir, fileNameFor(url));
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
} finally {
  await browser.close();
}
