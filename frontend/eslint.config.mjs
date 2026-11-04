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
    files: ["features/**/index.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
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
