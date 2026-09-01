export type SchoolDetail = {
  id: number;
  name: string;
  prefecture_name: string;
  student_count: number;
  teacher_count: number;
};

export type GradeScope = "own_grade" | "all_grades";

export type Grade = {
  id: number;
  name: string;
};

export type Teacher = {
  id: number;
  name: string;
  email: string;
  grade_scope: GradeScope;
  manage_other_teachers: boolean;
  grades: Grade[];
};

export type TeachersData = {
  teachers: Teacher[];
};

export type GradesData = {
  grades: Grade[];
};

// コース割当タブ用: 割当済みコース1件分。
export type CourseAssignment = {
  id: number;
  assigned_at: string;
  course: {
    id: number;
    level_number: number;
    level_name: string;
    subject: { id: number; name: string } | null;
  };
};

export type CourseAssignmentsData = {
  course_assignments: CourseAssignment[];
};

// コース割当のプルダウン用に一覧取得するコース候補。
export type CourseOption = {
  id: number;
  level_name: string;
  level_number: number;
  subject: { id: number; name: string } | null;
};

export type AnnouncementStatus = "draft" | "scheduled" | "published";

export type Announcement = {
  id: number;
  title: string;
  status: AnnouncementStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export type AnnouncementsMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type AnnouncementsData = {
  announcements: Announcement[];
  meta: AnnouncementsMeta;
};

// 教師追加ドロワーの入力（姓/名は結合してAPIへ渡す）。
export type CreateTeacherInput = {
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  gradeScope: GradeScope;
  manageOtherTeachers: boolean;
  gradeIds: number[];
};

// 教師編集ドロワーの入力（パスワードは変更不可）。
export type UpdateTeacherInput = {
  lastName: string;
  firstName: string;
  email: string;
  gradeScope: GradeScope;
  manageOtherTeachers: boolean;
  gradeIds: number[];
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
