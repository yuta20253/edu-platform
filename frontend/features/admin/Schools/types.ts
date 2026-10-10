import type { PaginationMeta } from "@/types/common/pagination";

export type School = {
  id: number;
  name: string;
  prefecture_name: string;
  student_count: number;
  teacher_count: number;
};

export type SchoolsData = {
  schools: School[];
  meta: PaginationMeta;
};
