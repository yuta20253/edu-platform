import type {
  CourseOption,
  ImportMode,
  ImportStatus,
  UnitOption,
  UserOption,
} from "@/types/common/import_history";

// インポート結果の1行。エラー・警告・成功で同じ形を使う。
export type ImportHistoryDetailRow = {
  row_number: number;
  message: string;
};

export type ImportHistoryDetailData = {
  id: number;
  course: CourseOption | null;
  unit: UnitOption | null;
  user: UserOption | null;
  file_name: string;
  status: ImportStatus;
  mode: ImportMode;
  total_count: number;
  success_count: number;
  error_count: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  errors: ImportHistoryDetailRow[];
  // warnings / successes は API 未実装（詳細APIは errors のみ返し、
  // warnings は常に空配列、成功行は永続化されていない）。
  // 将来APIが返すようになった際に表示が埋まるよう optional で定義しておく。
  warnings?: ImportHistoryDetailRow[];
  successes?: ImportHistoryDetailRow[];
};

export type DetailTabValue = "errors" | "warnings" | "successes";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
