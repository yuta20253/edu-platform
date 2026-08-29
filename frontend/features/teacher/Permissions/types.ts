export type GradeScope = "own_grade" | "all_grades";

export type TeacherPermission = {
  id: number;
  grade_scope: GradeScope;
  manage_other_teachers: boolean;
};

export type CurrentUser = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    year: number;
    display_name: string;
  };
  invitation_status: "pending" | "sent" | "failed";
  teacher_permission: TeacherPermission;
};

export type PermissionTeacher = {
  id: number;
  name: string;
  teacher_permission: TeacherPermission;
};

export type PermissionsMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type PermissionsData = {
  current_user: CurrentUser;
  teachers: PermissionTeacher[];
  meta: PermissionsMeta;
};

export type UpdatePermissionInput = {
  grade_scope: GradeScope;
  manage_other_teachers: boolean;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
