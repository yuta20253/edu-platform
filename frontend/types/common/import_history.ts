export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export type ImportMode = "append" | "overwrite";

export type ImportHistory = {
  id: number;
  file_name: string;
  status: ImportStatus;
  success_count: number;
  error_count: number;
  total_count: number;
  created_at: string;
};

// インポート履歴のフィルタ・サマリーで参照する関連レコードの最小表現。
// 一覧のプルダウンと詳細のサマリーで同じ形を使う。
export type CourseOption = { id: number; level_name: string };
export type UnitOption = { id: number; unit_name: string };
export type UserOption = { id: number; name: string };
