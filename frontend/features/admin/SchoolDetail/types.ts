import type { PaginationMeta } from "@/types/common/pagination";

export type SchoolDetail = {
  id: number;
  name: string;
  prefecture_name: string;
  student_count: number;
  teacher_count: number;
};

// GET /high_schools/:id のレスポンス。単体は単数形のキー（school）に包まれて返る。
export type SchoolDetailData = {
  school: SchoolDetail;
};

export type GradeScope = "own_grade" | "all_grades";

// GET /high_schools/:id/grades（学年一覧、Admin::GradeSerializer）のレスポンス形状。
export type Grade = {
  id: number;
  year: number;
  display_name: string;
};

// 教師に紐づく担当学年（Admin::TeacherSerializer#grades）。
// 上記Gradeとは異なりnameキーで返る点に注意。
export type TeacherGrade = {
  id: number;
  name: string;
};

export type Teacher = {
  id: number;
  name: string;
  name_kana: string | null;
  email: string;
  grade_scope: GradeScope;
  manage_other_teachers: boolean;
  grades: TeacherGrade[];
  // teacher_permissions の行の版（users の行ではない）。更新時に送り、古ければ 409 になる
  permission_lock_version: number;
};

export type TeachersData = {
  teachers: Teacher[];
  meta: PaginationMeta;
};

export type GradesData = {
  grades: Grade[];
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

export type AnnouncementsData = {
  announcements: Announcement[];
  meta: PaginationMeta;
};

// 教師追加ドロワーの入力（姓/名は結合してAPIへ渡す）。
// パスワードは指定せず、バックエンド側が招待メールを送信して本人に設定させる。
export type CreateTeacherInput = {
  lastName: string;
  firstName: string;
  // 氏名カナ（姓/名は結合して name_kana としてAPIへ渡す）
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  gradeScope: GradeScope;
  manageOtherTeachers: boolean;
  gradeIds: number[];
};

// 教師編集ドロワーの入力（パスワードは変更不可）。
export type UpdateTeacherInput = {
  lastName: string;
  firstName: string;
  // 氏名カナ（姓/名は結合して name_kana としてAPIへ渡す）
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  gradeScope: GradeScope;
  manageOtherTeachers: boolean;
  gradeIds: number[];
};
