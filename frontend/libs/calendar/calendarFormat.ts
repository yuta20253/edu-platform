import { format } from "date-fns";
import { ja } from "date-fns/locale";

// カレンダー画面で使う日付の表記をまとめる

// 月の見出し(例: 2026年10月)
export const formatMonthLabel = (month: Date) => format(month, "yyyy年M月");

// 日付セルの読み上げラベル(例: 10月6日)
export const formatDayLabel = (date: Date) => format(date, "M月d日");

// 予定一覧の見出し(例: 10月6日(火))
export const formatDayLabelWithWeekday = (date: Date) =>
  format(date, "M月d日(E)", { locale: ja });

// API の from / to に渡す形式(例: 2026-10-06)
export const toApiDate = (date: Date) => format(date, "yyyy-MM-dd");

// 日付ごとに予定をまとめるキー(例: 2026/10/06)。生徒カレンダーAPIの date と同じ形式で、
// 教員カレンダーでは scheduled_at をこの形式に変換してまとめる
export const toDateKey = (date: Date) => format(date, "yyyy/MM/dd");

// 月単位のキー(例: 2026-10)
export const toMonthKey = (month: Date) => format(month, "yyyy-MM");
