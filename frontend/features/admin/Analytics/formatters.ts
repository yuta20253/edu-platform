import type { KpiValue } from "./types";

export type TrendDirection = "up" | "down" | "flat";

export type Trend = {
  direction: TrendDirection;
  // 前期間が0の場合は増減率を算出できないため null
  percent: number | null;
};

const roundToFirstDecimal = (value: number) => Math.round(value * 10) / 10;

// 前期間比。上昇=up・下降=down・同値=flat と、増減率(絶対値・小数1桁)を返す。
export const calcTrend = ({ current, previous }: KpiValue): Trend => {
  if (current === previous) return { direction: "flat", percent: 0 };

  const direction: TrendDirection = current > previous ? "up" : "down";
  if (previous === 0) return { direction, percent: null };

  return {
    direction,
    percent: roundToFirstDecimal(
      (Math.abs(current - previous) / previous) * 100,
    ),
  };
};

// 分 →「◯時間◯分」。60分未満は「◯分」。
export const formatStudyMinutes = (minutes: number) => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours > 0 ? `${hours}時間${rest}分` : `${rest}分`;
};
