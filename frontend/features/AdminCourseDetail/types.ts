export type Subject = {
  id: number;
  name: string;
};

export type CourseUnit = {
  id: number;
  unit_name: string;
  questions_count: number;
};

export type AdminCourseDetail = {
  id: number;
  subject: Subject;
  level_number: number;
  level_name: string;
  description: string | null;
  units: CourseUnit[];
};
