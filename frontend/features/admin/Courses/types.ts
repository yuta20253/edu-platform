import type { PaginationMeta } from "@/types/common/pagination";
import type { Subject } from "@/types/common/subject";

export type AdminCourse = {
  id: number;
  level_name: string;
  level_number: number;
  subject: Subject | null;
  units_count: number;
  questions_count: number;
  created_at: string;
};

export type CoursesData = {
  courses: AdminCourse[];
  meta: PaginationMeta;
};

export type CourseSort = "level_name" | "created_at" | "id";

export type CourseOrder = "asc" | "desc";
