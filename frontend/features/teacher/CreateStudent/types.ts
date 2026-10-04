export type GradeScope = "own_grade" | "all_grades";

type SchoolClassOption = {
  id: number;
  name: string;
};

export type GradeOption = {
  id: number;
  year: number;
  display_name: string;
  school_classes: SchoolClassOption[];
};

export type CreateStudentInput = {
  name: string;
  name_kana: string;
  email: string;
  grade_id: number;
  school_class_id: number;
};
