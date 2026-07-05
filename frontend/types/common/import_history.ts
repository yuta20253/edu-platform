export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export type ImportHistory = {
  id: number;
  file_name: string;
  status: ImportStatus;
  success_count: number;
  error_count: number;
  total_count: number;
  created_at: string;
};
