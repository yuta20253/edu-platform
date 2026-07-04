import { ImportStatus } from "@/types/common/import_history";

// CSVインポート履歴ステータスの日本語ラベル。
// 色は画面ごとに表現方法（生の色コード / MUI color prop）が異なるため共通化しない。
export const importStatusLabel: Record<ImportStatus, string> = {
  pending: "待機中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};
