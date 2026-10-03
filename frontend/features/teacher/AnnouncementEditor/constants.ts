import type { TargetType } from "./types";

export const ALL_TARGET_TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "all_users", label: "全員" },
  { value: "by_role", label: "権限別" },
  { value: "by_grade", label: "学年別" },
  { value: "by_school", label: "学校全体" },
  { value: "by_user", label: "個人" },
];

// 学年別・個人以外は学年による絞り込みを行わないため、own_grade_restriction
// がある教員がこれらを選ぶと自分の学年外にも配信できてしまう。
// Rails側のgrade_scope_validationはby_gradeタイプのみ検証するため、
// UI側でも選択肢自体を絞ってこれを防ぐ。
export const GRADE_RESTRICTED_TARGET_TYPE_OPTIONS: {
  value: TargetType;
  label: string;
}[] = ALL_TARGET_TYPE_OPTIONS.filter(
  (opt) => opt.value === "by_grade" || opt.value === "by_user",
);
