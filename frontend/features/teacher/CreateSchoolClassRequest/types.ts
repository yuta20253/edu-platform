import type { SchoolClassRequestAction } from "@/types/schoolClassRequest/schoolClassRequest";

// 学級一覧API(/api/teacher/school-classes)のレスポンス。学年・クラスの選択肢に使う
export type GradeOption = {
  id: number;
  year: number;
  display_name: string;
  school_classes: { id: number; name: string }[];
};

export type CreateSchoolClassRequestForm = {
  action: SchoolClassRequestAction;
  grade_id: number;
  // 改名・削除のときだけ使う
  school_class_id?: number;
  // 新設・改名のときだけ使う
  name?: string;
};
