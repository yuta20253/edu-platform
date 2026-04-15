export type DashboardStats = {
  grade_one_students_count: number;
  grade_two_students_count: number;
  grade_three_students_count: number;
};

export type AnnouncementType = {
  id: number;
  title: string;
  content: string;
  published_at: string;
};

export type TeacherDashboardData = {
  stats: DashboardStats;
  announcements: AnnouncementType[];
};
