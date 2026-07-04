import type { ImportHistory } from "@/types/common/import_history";

export type DashboardStats = {
  student_count: number;
  teacher_count: number;
  admin_count: number;
  total_questions: number;
};

export type AdminDashboardData = {
  stats: DashboardStats;
  recent_imports: ImportHistory[];
};
