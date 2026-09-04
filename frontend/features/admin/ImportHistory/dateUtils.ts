import { format, isValid, parseISO } from "date-fns";

// DatePicker のフィルタ入力とクエリパラメータの相互変換。
// 表示用の日時フォーマットは libs/ui/formatDate の formatDateTime を使う。
export const dateToInput = (value: string) => (value ? parseISO(value) : null);

export const dateToParam = (date: Date | null) =>
  date && isValid(date) ? format(date, "yyyy-MM-dd") : "";
