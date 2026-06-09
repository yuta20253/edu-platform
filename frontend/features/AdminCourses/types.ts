export type Subject = {
  id: number;
  name: string;
};

export type AdminCourse = {
  id: number;
  level_name: string;
  level_number: number;
  subject: Subject | null;
  units_count: number;
  questions_count: number;
  created_at: string;
};

export type AdminCourseMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type AdminCoursesData = {
  courses: AdminCourse[];
  meta: AdminCourseMeta;
};

export type CourseSort = "level_name" | "created_at" | "id";

export type CourseOrder = "asc" | "desc";

export const PER_PAGE_OPTIONS = [20, 50, 100] as const;
