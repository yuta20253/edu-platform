import { format } from "date-fns";

// タスクの期限が目標の期限以前かを検証する。react-hook-form の validate にそのまま渡せる形(true | エラー文言)で返す。
// CreateTask・EditTask の両方で使う
export const validateTaskDueDate = (
  value: Date | null,
  goalDueDate: string | null | undefined,
): true | string => {
  if (!value || !goalDueDate) return true;

  return (
    format(value, "yyyy-MM-dd") <=
      format(new Date(goalDueDate), "yyyy-MM-dd") ||
    "期限は目標の期限以前にしてください"
  );
};
