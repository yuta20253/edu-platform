import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// 管理画面の配色は app/theme/colors.ts を単一の正とする（#71）。
// 以前は ImportHistory / ImportHistoryDetail が `const flat = { border: "#E6E9ED", ... }` の
// ようなローカルトークンを宣言して colors.ts を迂回しており、2画面だけ見た目が分岐していた。
// 同じことが再発していないかを、他のテストでは検出できないためソースを走査して確認する。
//
// 色を追加したくなった場合はこのテストを緩めるのではなく、colors.ts にトークンを追加すること。

const ADMIN_FEATURES_DIR = join(__dirname);

// #RGB / #RGBA / #RRGGBB / #RRGGBBAA 形式のリテラル
const HEX_COLOR = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });

describe("features/admin の配色", () => {
  it("ハードコードされた色が含まれていない", () => {
    const offenders = collectSourceFiles(ADMIN_FEATURES_DIR).flatMap((path) => {
      const matches = readFileSync(path, "utf8").match(HEX_COLOR) ?? [];
      return matches.map(
        (hex) => `${path.replace(`${process.cwd()}/`, "")}: ${hex}`,
      );
    });

    expect(offenders).toEqual([]);
  });
});
