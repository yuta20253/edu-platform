export type TeacherMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type Teacher = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    year: number;
    display_name: string;
  };
  teacher_permission: {
    id: number;
    grade_scope: number;
    manage_other_teachers: boolean;
  };
};

export type TeachersData = {
  teachers: Teacher[];
  meta: TeacherMeta;
};
