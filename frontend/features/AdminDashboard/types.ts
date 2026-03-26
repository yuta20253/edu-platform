export type DashboardStats = {
  student_count: number;
  teacher_count: number;
  admin_count: number;
  total_questions: number;
};

export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export type RecentImport = {
  id: number;
  file_name: string;
  status: ImportStatus;
  success_count: number;
  error_count: number;
  total_count: number;
  created_at: string;
};

export type AdminDashboardData = {
  stats: DashboardStats;
  recent_imports: RecentImport[];
};
