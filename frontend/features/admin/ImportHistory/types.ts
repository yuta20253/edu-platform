import type {
  CourseOption,
  ImportMode,
  ImportStatus,
  UnitOption,
  UserOption,
} from "@/types/common/import_history";

export type { CourseOption, UnitOption, UserOption };

export type ImportHistoryStatus = ImportStatus;
export type ImportHistoryMode = ImportMode;

export type ImportHistoryRow = {
  id: number;
  course: CourseOption | null;
  unit: UnitOption | null;
  user: UserOption | null;
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
