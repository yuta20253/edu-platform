import type { ImportHistory } from "@/types/common/import_history";
import type { AnnouncementStatus } from "@/types/common/announcement";

export type DashboardStats = {
  student_count: number;
  active_student_count: number;
  teacher_count: number;
  admin_count: number;
  total_questions: number;
  pending_student_count: number;
  pending_teacher_count: number;
};

export type DashboardAnnouncement = {
  id: number;
  title: string;
  status: AnnouncementStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export type DashboardMeta = {
  active_student_period_days: number;
  generated_at: string;
};

export type DashboardData = {
  stats: DashboardStats;
  recent_imports: ImportHistory[];
  recent_announcements: DashboardAnnouncement[];
  meta: DashboardMeta;
};
