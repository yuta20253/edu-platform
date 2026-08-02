export type TeacherMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type GradeScope = "own_grade" | "all_grades";

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
    grade_scope: GradeScope;
    manage_other_teachers: boolean;
  };
  invitation_status: "not_sent" | "sent" | "failed";
};

export type TeachersData = {
  current_user: Teacher;
  teachers: Teacher[];
  meta: TeacherMeta;
};

export type CreateTeacherInput = {
  name: string;
  name_kana: string;
  email: string;
  grade_id: number;
  grade_scope: GradeScope;
  manage_other_teachers: boolean;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
