import type { Subject } from "@/types/common/subject";

export type CourseUnit = {
  id: number;
  unit_name: string;
  questions_count: number;
};

export type CourseDetail = {
  id: number;
  subject: Subject;
  level_number: number;
  level_name: string;
  description: string | null;
  units: CourseUnit[];
};
