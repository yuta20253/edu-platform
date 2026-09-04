import { ImportMode, ImportStatus } from "@/types/common/import_history";

// CSVインポート履歴ステータスの日本語ラベル。
export const importStatusLabel: Record<ImportStatus, string> = {
  pending: "待機中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};

// MUI の color prop 用の色マップ。Chip などに直接渡す画面で使う。
// 生の色コードで独自に表現する画面（ダッシュボード等）は各自で定義する。
export const importStatusColor: Record<
  ImportStatus,
  "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
};

// インポートモードの日本語ラベル。
export const importModeLabel: Record<ImportMode, string> = {
  append: "追加",
  overwrite: "上書き",
};
