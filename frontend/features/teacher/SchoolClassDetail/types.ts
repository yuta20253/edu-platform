type SchoolClassTeacher = {
  id: number;
  name: string;
  role: "homeroom" | "assistant";
};

type SchoolClassStudent = {
  id: number;
  name: string;
  name_kana: string;
};

type SchoolClassGrade = {
  id: number;
  year: number;
  display_name: string;
};

export type SchoolClassDetailType = {
  id: number;
  name: string;
  grade: SchoolClassGrade;
  teachers: SchoolClassTeacher[];
  students: SchoolClassStudent[];
};
