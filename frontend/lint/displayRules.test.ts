// @vitest-environment node
import { FlatESLint } from "eslint/use-at-your-own-risk";
import { beforeAll, describe, expect, it } from "vitest";

// データ取得画面の表示規約(frontend/CLAUDE.md)を守るための ESLint のルールを、
// 本物の設定(eslint.config.mjs)を読ませて確かめる。設定を複製するとずれるため、
// ルールの中身ではなく「この入力で error が出る/出ない」だけを見る。
//
// 注意: vitest の既定の除外に eslint.config.* が含まれるため、このテストは
// eslint.config.test.ts ではなく lint/ に置いている。

const eslint = new FlatESLint({ overrideConfigFile: "eslint.config.mjs" });

type Hit = { rule: string; line: number };

// 表示規約に関係するルールと、不要になった eslint-disable の検出だけを返す
// (サンプルコードが他のルールに引っかかっても影響されないようにする)
const lint = async (code: string, filePath: string): Promise<Hit[]> => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages
    .filter(
      (m) =>
        m.ruleId === "no-restricted-imports" ||
        m.ruleId === "no-restricted-syntax" ||
        m.message.startsWith("Unused eslint-disable directive"),
    )
    .map((m) => ({ rule: m.ruleId ?? "unused-directive", line: m.line }));
};

const rules = (hits: Hit[]) => hits.map((h) => h.rule);

const INDEX = "features/sample/index.tsx";
const PRESENTER = "features/sample/Presenter.tsx";
const INDEX_TEST = "features/sample/index.test.tsx";

beforeAll(async () => {
  // 設定の読み込み(約 3 秒)を、最初のテストの時間に含めない
  await lint("export const warmUp = 1;\n", "features/sample/warmUp.ts");
}, 30000);

describe("CircularProgress の import(features/**/index.tsx のみ)", () => {
  it("名前付き import は error になる", async () => {
    const hits = await lint(
      'import { CircularProgress } from "@mui/material";\nexport const A = () => <CircularProgress />;\n',
      INDEX,
    );

    expect(rules(hits)).toEqual(["no-restricted-imports"]);
  });

  it("別名の import も error になる", async () => {
    const hits = await lint(
      'import { CircularProgress as Spinner } from "@mui/material";\nexport const A = () => <Spinner />;\n',
      INDEX,
    );

    expect(rules(hits)).toEqual(["no-restricted-imports"]);
  });

  it("個別 import(@mui/material/CircularProgress)は error になる", async () => {
    const hits = await lint(
      'import CircularProgress from "@mui/material/CircularProgress";\nexport const A = () => <CircularProgress />;\n',
      INDEX,
    );

    expect(rules(hits)).toEqual(["no-restricted-imports"]);
  });

  it("index.tsx 以外(送信ボタンのスピナーなど)は error にならない", async () => {
    const hits = await lint(
      'import { CircularProgress } from "@mui/material";\nexport const A = () => <CircularProgress size={16} />;\n',
      PRESENTER,
    );

    expect(hits).toEqual([]);
  });

  it("テストファイルは error にならない", async () => {
    const hits = await lint(
      'import { CircularProgress } from "@mui/material";\nexport const A = () => <CircularProgress />;\n',
      INDEX_TEST,
    );

    expect(hits).toEqual([]);
  });
});
