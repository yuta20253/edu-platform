import type { Status } from "@/types/common/status";

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

// 期限はAPIから「YYYY/MM/DD」で返るので、今日の日付を同じ形にして文字列で比べる
export const isOverdue = (
  dueDate: string | null,
  status: Status,
  today: Date = new Date(),
) => {
  if (dueDate === null || status === "completed") return false;
  return dueDate < formatDate(today);
};
