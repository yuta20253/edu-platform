import { format, isValid, parse, subDays } from "date-fns";
import { tokyoToday } from "@/libs/date/tokyoDate";

export type PeriodPreset = 7 | 30 | 90;

export const PERIOD_PRESETS: readonly PeriodPreset[] = [7, 30, 90];

// from・to が空のときはバックエンドの既定値(直近7日)で集計する
export type AnalyticsPeriod = {
  from: string;
  to: string;
};

const DATE_FORMAT = "yyyy-MM-dd";
export const DEFAULT_PRESET: PeriodPreset = 7;
const DEFAULT_PERIOD: AnalyticsPeriod = { from: "", to: "" };

export const isDefaultPeriod = ({ from, to }: AnalyticsPeriod) => !from && !to;

// 今日を含む N 日間。バックエンドの既定値(直近7日=6日前〜今日)と揃える。
// today は日本時間の今日(tokyoToday)を渡す
export const presetRange = (
  days: PeriodPreset,
  today: Date = tokyoToday(),
): AnalyticsPeriod => ({
  from: format(subDays(today, days - 1), DATE_FORMAT),
  to: format(today, DATE_FORMAT),
});

export const detectPreset = (
  { from, to }: AnalyticsPeriod,
  today: Date = tokyoToday(),
): PeriodPreset | null => {
  if (isDefaultPeriod({ from, to })) return DEFAULT_PRESET;

  const match = PERIOD_PRESETS.find((days) => {
    const range = presetRange(days, today);
    return range.from === from && range.to === to;
  });
  return match ?? null;
};

const isValidDate = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parse(value, DATE_FORMAT, new Date(0));
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value;
};

// URL はリロード・共有されるため、不正な値は取り込まない。
// 片方だけ正しい場合も、意図しない期間にならないよう両方とも捨ててデフォルト期間にする
export const periodFromSearchParams = (
  params: URLSearchParams,
): AnalyticsPeriod => {
  const from = params.get("from");
  const to = params.get("to");
  return isValidDate(from) && isValidDate(to) ? { from, to } : DEFAULT_PERIOD;
};

export const periodToSearchParams = ({ from, to }: AnalyticsPeriod) => {
  const params = new URLSearchParams();
  if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }
  return params;
};
