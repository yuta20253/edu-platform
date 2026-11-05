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

describe("失敗文言の直書き(features/**/*.tsx)", () => {
  const ALERT =
    '<Alert severity="error">データの取得に失敗しました。再読み込みしてください。</Alert>';

  it("JSX のテキストに「取得に失敗」を書くと error になる(index.tsx)", async () => {
    const hits = await lint(`export const A = () => ${ALERT};\n`, INDEX);

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });

  it("JSX のテキストに「取得に失敗」を書くと error になる(Presenter などの index.tsx 以外も)", async () => {
    const hits = await lint(`export const A = () => ${ALERT};\n`, PRESENTER);

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });

  it("ErrorState の既定文言そのもの(「データの取得に失敗しました」)をリテラルで書くと error になる", async () => {
    const hits = await lint(
      'export const message = "データの取得に失敗しました";\n',
      INDEX,
    );

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });

  it("errorMessage などの属性に具体的な文言を渡すのは error にならない(採用済みのパターン)", async () => {
    const hits = await lint(
      'export const A = () => <AsyncBoundary data={null} errorMessage="タスクの取得に失敗しました" />;\n',
      INDEX,
    );

    expect(hits).toEqual([]);
  });

  it("テストファイルは error にならない", async () => {
    const hits = await lint(`export const A = () => ${ALERT};\n`, INDEX_TEST);

    expect(hits).toEqual([]);
  });

  it("features 以外(ErrorState の既定文言を持つ components/ui など)は error にならない", async () => {
    const hits = await lint(
      'export const DEFAULT_MESSAGE = "データの取得に失敗しました";\n',
      "components/ui/ErrorState.tsx",
    );

    expect(hits).toEqual([]);
  });
});

describe("loading の分岐(features/**/index.tsx のみ)", () => {
  // 手書きの取得フックが loading を返す新しい画面を想定したサンプル
  const wrap = (statement: string) =>
    `export const A = () => {\n  const { loading, isLoading, x, cond } = useThing();\n  ${statement}\n  return null;\n};\n`;

  it.each([
    ["if (loading)", "if (loading) return null;"],
    ["if (!loading)", "if (!loading) return null;"],
    ["if (x || loading)", "if (x || loading) return null;"],
    ["三項演算子の条件", "const a = loading ? 1 : 2;"],
    ["三項演算子の条件(否定)", "const a = !isLoading ? 1 : 2;"],
    ["&& の左辺", "const a = loading && <p />;"],
    ["isLoading", "if (isLoading) return null;"],
  ])("%s は error になる", async (_, statement) => {
    const hits = await lint(wrap(statement), INDEX);

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });

  it.each([
    ["if (state.loading)", "if (state.loading) return null;"],
    ["if (!state.isLoading)", "if (!state.isLoading) return null;"],
    ["三項演算子の条件", "const a = state.loading ? 1 : 2;"],
    ["&& の左辺", "const a = state.loading && <p />;"],
  ])(
    "戻り値を丸ごと受け取ったときのメンバー参照(%s)も error になる",
    async (_, statement) => {
      const hits = await lint(
        `export const A = () => {\n  const state = useThing();\n  ${statement}\n  return null;\n};\n`,
        INDEX,
      );

      expect(rules(hits)).toEqual(["no-restricted-syntax"]);
    },
  );

  it("loading をメンバー参照で props として渡すだけ(<P loading={state.loading} />)は error にならない", async () => {
    const hits = await lint(
      "export const A = () => {\n  const state = useThing();\n  const a = cond ? <Presenter loading={state.loading} /> : null;\n  return a;\n};\n",
      INDEX,
    );

    expect(hits).toEqual([]);
  });

  it("リネームして受け取った loading(teacherLoading)の分岐も error になる", async () => {
    const hits = await lint(
      "export const A = () => {\n  const { loading: teacherLoading } = useThing();\n  if (teacherLoading) return null;\n  return null;\n};\n",
      INDEX,
    );

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });

  it.each([
    ["if の本体", "if (cond) { return <Presenter loading={loading} />; }"],
    [
      "三項演算子の本体",
      "const a = cond ? <Presenter loading={loading} /> : null;",
    ],
    ["&& の右辺", "const a = cond && <Presenter loading={loading} />;"],
  ])(
    "loading を props として渡すだけ(%s)は error にならない",
    async (_, statement) => {
      const hits = await lint(wrap(statement), INDEX);

      expect(hits).toEqual([]);
    },
  );

  it("index.tsx 以外(Presenter など)の loading の分岐は error にならない", async () => {
    const hits = await lint(wrap("if (loading) return null;"), PRESENTER);

    expect(hits).toEqual([]);
  });

  it("テストファイルは error にならない", async () => {
    const hits = await lint(wrap("if (loading) return null;"), INDEX_TEST);

    expect(hits).toEqual([]);
  });

  it("index.tsx では、loading の分岐と失敗文言の両方が検出される(同じルールの設定が置き換わらない)", async () => {
    const hits = await lint(
      wrap("if (loading) return <Alert>データの取得に失敗しました</Alert>;"),
      INDEX,
    );

    expect(rules(hits)).toEqual([
      "no-restricted-syntax",
      "no-restricted-syntax",
    ]);
  });

  it("index.tsx 以外では、失敗文言だけが検出される", async () => {
    const hits = await lint(
      wrap("if (loading) return <Alert>データの取得に失敗しました</Alert>;"),
      PRESENTER,
    );

    expect(rules(hits)).toEqual(["no-restricted-syntax"]);
  });
});

describe("例外(eslint-disable)の書き方と、消し忘れの検出", () => {
  const REASON = "表示規約の例外(一時): TSK-231 で移行予定";

  it("単行の開始タグ: 開始タグの行の直前の {/* */} で、違反が消える", async () => {
    const hits = await lint(
      `export const A = () => (
  <Box>
    {/* eslint-disable-next-line no-restricted-syntax -- ${REASON} */}
    <Alert severity="error">
      教員情報の取得に失敗しました。
    </Alert>
  </Box>
);
`,
      INDEX,
    );

    expect(hits).toEqual([]);
  });

  it("複数行の開始タグ + 三項演算子: タグ内の > の直前の // で、違反が消える", async () => {
    const hits = await lint(
      `export const A = ({ error }: { error: boolean }) => (
  <div>
    {error ? (
      <Typography
        variant="body2"
        // eslint-disable-next-line no-restricted-syntax -- ${REASON}
      >
        データの取得に失敗しました
      </Typography>
    ) : null}
  </div>
);
`,
      PRESENTER,
    );

    expect(hits).toEqual([]);
  });

  it("複数行の開始タグ + 三項演算子で、{/* */} を三項演算子の前に置くと効かない(不要な disable と違反の二重エラー)", async () => {
    const hits = await lint(
      `export const A = ({ error }: { error: boolean }) => (
  <div>
    {/* eslint-disable-next-line no-restricted-syntax -- ${REASON} */}
    {error ? (
      <Typography
        variant="body2"
      >
        データの取得に失敗しました
      </Typography>
    ) : null}
  </div>
);
`,
      PRESENTER,
    );

    expect(rules(hits)).toEqual(["unused-directive", "no-restricted-syntax"]);
  });

  it("違反が無い行に付いた eslint-disable は、消し忘れとして error になる", async () => {
    const hits = await lint(
      `// eslint-disable-next-line no-restricted-imports -- ${REASON}
import { Box } from "@mui/material";
export const A = () => <Box />;
`,
      INDEX,
    );

    expect(rules(hits)).toEqual(["unused-directive"]);
  });

  it("違反のある import に付けた eslint-disable は、そのまま通る", async () => {
    const hits = await lint(
      `// eslint-disable-next-line no-restricted-imports -- 表示規約の例外(恒久): ハイドレーション待ち
import { CircularProgress } from "@mui/material";
export const A = () => <CircularProgress />;
`,
      INDEX,
    );

    expect(hits).toEqual([]);
  });
});
