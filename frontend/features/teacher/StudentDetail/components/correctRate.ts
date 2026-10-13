import { colors } from "@/app/theme/colors";
import { CORRECT_RATE_THRESHOLD } from "../constants";

// 正答率はAPIで未解答のとき null になるため、そのときは「-」を出す
export const formatCorrectRate = (rate: number | null) =>
  rate === null ? "-" : `${rate}%`;

export const getCorrectRateColor = (rate: number | null) => {
  if (rate === null) return colors.text.muted;
  if (rate >= CORRECT_RATE_THRESHOLD.GOOD) return colors.status.success;
  if (rate < CORRECT_RATE_THRESHOLD.POOR) return colors.status.error;
  return colors.text.primary;
};
