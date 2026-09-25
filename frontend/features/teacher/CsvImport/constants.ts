import type { CsvImportState } from "./types";

export const STEP_LABELS: Record<CsvImportState["step"], string> = {
  1: "Step 1: ファイル選択",
  2: "Step 2: プレビュー・検証",
  3: "Step 3: 確認",
  4: "Step 4: 完了",
};

//「学年」列はこのいずれかの文字列と完全一致している必要がある
export const GRADE_DISPLAY_NAMES = [
  "中３生",
  "高１生",
  "高２生",
  "高３生",
  "高卒生",
  "新高１生",
  "新高２生",
  "新高３生",
] as const;
