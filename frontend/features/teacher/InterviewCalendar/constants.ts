import { colors } from "@/app/theme/colors";

// 教員画面のカード(白背景 + 枠線)。カレンダーと選択日の面談一覧で共通に使う
export const cardSx = {
  bgcolor: colors.surface.white,
  border: `1px solid ${colors.border.light}`,
  borderRadius: 2,
} as const;
