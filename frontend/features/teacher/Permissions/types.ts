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

// 編集ドロワーを開くときに取り直す権限(GET /api/teacher/permissions/:id)。
// lock_version は保存時の楽観ロックに使う
export type PermissionTeacherDetail = {
  id: number;
  name: string;
  teacher_permission: TeacherPermission & { lock_version: number };
};

// 保存時に送る値。開いた時点の lock_version を添える
export type UpdatePermissionPayload = UpdatePermissionInput & {
  lock_version: number;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
