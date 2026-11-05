import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// データ取得画面の表示規約(frontend/CLAUDE.md)を守るためのルール。
// 手書きのローディング・エラー表示を features/**/index.tsx に書かない。
// やむを得ない例外は、違反の行の直前に、ルール名と理由つきの disable コメントで書く。
// 理由は「表示規約の例外(恒久): <理由>」か「表示規約の例外(一時): <チケット番号> で移行予定」で始める。
const CIRCULAR_PROGRESS_MESSAGE =
  "ローディング表示は AsyncBoundary(components/ui/AsyncBoundary.tsx)に任せ、index.tsx で CircularProgress を直接使わない。" +
  "取得状態ではない待ち(ハイドレーションなど)は、違反の行に「表示規約の例外(恒久): <理由>」の eslint-disable を付ける。";

const FAILURE_TEXT_MESSAGE =
  "取得失敗の表示は ErrorState(components/ui/ErrorState.tsx)か AsyncBoundary の errorMessage に任せ、" +
  "Alert などで手書きしない。具体的な文言は errorMessage や message の属性に渡す(属性の文言は許可)。" +
  "やむを得ない例外は「表示規約の例外(恒久|一時): …」の eslint-disable を付ける。";

// 同じルールを後の設定ブロックが置き換えるため、index.tsx のブロックにもこの配列を展開して使う
const FAILURE_TEXT_SELECTORS = [
  {
    // 手書きの失敗表示(JSX のテキスト)。attribute の文字列(errorMessage など)は対象外
    selector: "JSXText[value=/取得に失敗/]",
    message: FAILURE_TEXT_MESSAGE,
  },
  {
    // ErrorState の既定文言そのものの直書き
    selector: "Literal[value='データの取得に失敗しました']",
    message: FAILURE_TEXT_MESSAGE,
  },
];

const LOADING_BRANCH_MESSAGE =
  "loading を条件にした分岐を index.tsx に書かない。取得中・失敗・成功の分岐は AsyncBoundary(components/ui/AsyncBoundary.tsx)に任せ、" +
  "取得は useApiQuery を使う。取得状態ではない待ちは「表示規約の例外(恒久): <理由>」の eslint-disable を付ける。";

// 条件の位置(if の条件・三項演算子の条件・&& の左辺)で、名前が loading で終わる識別子(state.loading のメンバー参照も)を使うことを禁止する。
// loading: teacherLoading のようなリネームにも当たる。props として渡すだけ(<P loading={loading} />)は当たらない。
const LOADING_NAME = "/[Ll]oading$/";
const LOADING_BRANCH_SELECTORS = [
  `IfStatement > Identifier.test[name=${LOADING_NAME}]`,
  `IfStatement > UnaryExpression.test > Identifier[name=${LOADING_NAME}]`,
  `IfStatement > LogicalExpression.test Identifier[name=${LOADING_NAME}]`,
  `ConditionalExpression > Identifier.test[name=${LOADING_NAME}]`,
  `ConditionalExpression > UnaryExpression.test > Identifier[name=${LOADING_NAME}]`,
  `ConditionalExpression > LogicalExpression.test Identifier[name=${LOADING_NAME}]`,
  `LogicalExpression > Identifier.left[name=${LOADING_NAME}]`,
  // useThing() の戻り値を丸ごと受け取った state.loading のようなメンバー参照。
  // 論理式の中(a || state.loading)は、上の「子孫の Identifier」がプロパティ名にも当たるので足さない
  `IfStatement > MemberExpression.test[property.name=${LOADING_NAME}]`,
  `IfStatement > UnaryExpression.test > MemberExpression[property.name=${LOADING_NAME}]`,
  `ConditionalExpression > MemberExpression.test[property.name=${LOADING_NAME}]`,
  `ConditionalExpression > UnaryExpression.test > MemberExpression[property.name=${LOADING_NAME}]`,
  `LogicalExpression > MemberExpression.left[property.name=${LOADING_NAME}]`,
].map((selector) => ({ selector, message: LOADING_BRANCH_MESSAGE }));

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // 例外の eslint-disable は、違反が直ったら消す(消し忘れを lint が教える)
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["features/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...FAILURE_TEXT_SELECTORS],
    },
  },
  {
    files: ["features/**/index.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...FAILURE_TEXT_SELECTORS,
        ...LOADING_BRANCH_SELECTORS,
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mui/material",
              importNames: ["CircularProgress"],
              message: CIRCULAR_PROGRESS_MESSAGE,
            },
            {
              name: "@mui/material/CircularProgress",
              message: CIRCULAR_PROGRESS_MESSAGE,
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
