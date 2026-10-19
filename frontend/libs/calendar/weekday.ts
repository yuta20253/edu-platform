import { colors } from "@/app/theme/colors";

// カレンダーの曜日見出し(日曜始まり)
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// 曜日見出しの文字色。日曜は赤、土曜は青にする
export const weekdayColor = (index: number) => {
  if (index === 0) return colors.status.error;
  if (index === 6) return colors.status.info;
  return colors.text.secondary;
};
