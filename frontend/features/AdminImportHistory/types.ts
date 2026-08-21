export type ImportHistoryStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ImportHistoryMode = "append" | "overwrite";

export type ImportHistoryRow = {
  id: number;
  course: { id: number; level_name: string } | null;
  unit: { id: number; unit_name: string } | null;
  user: { id: number; name: string } | null;
  file_name: string;
  status: ImportHistoryStatus;
  mode: ImportHistoryMode;
  total_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
};

export type ImportHistoryMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type ImportHistoriesData = {
  import_histories: ImportHistoryRow[];
  meta: ImportHistoryMeta;
};

export type ImportHistorySort =
  | "created_at"
  | "total_count"
  | "success_count"
  | "error_count"
  | "status";

export type ImportHistoryOrder = "asc" | "desc";

export type ImportHistoryFilters = {
  status: ImportHistoryStatus | "";
  courseId: string;
  unitId: string;
  userId: string;
  from: string;
  to: string;
};

export const PER_PAGE_OPTIONS = [20, 50, 100] as const;

export const IMPORT_STATUS_LABEL: Record<ImportHistoryStatus, string> = {
  pending: "待機中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};

export const IMPORT_STATUS_COLOR: Record<
  ImportHistoryStatus,
  "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
};
