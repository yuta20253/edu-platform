// none は前期間のデータがなく比較できない状態
export type TrendDirection = "up" | "down" | "flat" | "none";

export type Trend = {
  direction: TrendDirection;
  text: string;
};

const NO_PREVIOUS: Trend = { direction: "none", text: "前期間なし" };

const roundToFirstDecimal = (value: number) => Math.round(value * 10) / 10;

const signedTrend = (diff: number, suffix: string): Trend => {
  const rounded = roundToFirstDecimal(diff);
  if (rounded === 0) return { direction: "flat", text: `±0${suffix}` };
  return rounded > 0
    ? { direction: "up", text: `+${rounded}${suffix}` }
    : { direction: "down", text: `${rounded}${suffix}` };
};

// 分 →「◯時間◯分」。60分未満は「◯分」
export const formatStudyMinutes = (minutes: number) => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours > 0 ? `${hours}時間${rest}分` : `${rest}分`;
};

// 率(%)どうしの比較は、増減率だと分かりにくいため差をポイントで表す
export const rateTrend = (current: number, previous: number | null): Trend =>
  previous === null ? NO_PREVIOUS : signedTrend(current - previous, "pt");

// 前期間が0分のときは増減率を計算できないため「前期間なし」とする
export const minutesTrend = (current: number, previous: number): Trend => {
  if (current === previous) return { direction: "flat", text: "±0%" };
  if (previous === 0) return NO_PREVIOUS;
  return signedTrend(((current - previous) / previous) * 100, "%");
};
