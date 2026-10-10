import { format, isValid, parse, subDays } from "date-fns";
import {
  PERIOD_PRESETS,
  type AnalyticsFilters,
  type PeriodPreset,
} from "./types";

const DATE_FORMAT = "yyyy-MM-dd";
const DEFAULT_PRESET: PeriodPreset = 30;

// 当日を含む N 日間。Rails 側の既定値（直近30日=29日前〜当日）と揃える。
export const presetRange = (days: PeriodPreset, today: Date = new Date()) => ({
  from: format(subDays(today, days - 1), DATE_FORMAT),
  to: format(today, DATE_FORMAT),
});

// 期間未指定は API の既定（直近30日）と同じなので 30 日プリセット扱いにする。
export const detectPreset = (
  { from, to }: Pick<AnalyticsFilters, "from" | "to">,
  today: Date = new Date(),
): PeriodPreset | null => {
  if (!from && !to) return DEFAULT_PRESET;

  const match = PERIOD_PRESETS.find((days) => {
    const range = presetRange(days, today);
    return range.from === from && range.to === to;
  });
  return match ?? null;
};

// URL は共有・リロードされるため、不正な値は取り込まずに無視する。
const sanitizeDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = parse(value, DATE_FORMAT, new Date(0));
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value ? value : "";
};

const sanitizeId = (value: string | null) =>
  value && /^\d+$/.test(value) ? value : "";

export const filtersFromSearchParams = (
  params: URLSearchParams,
): AnalyticsFilters => ({
  from: sanitizeDate(params.get("from")),
  to: sanitizeDate(params.get("to")),
  highSchoolId: sanitizeId(params.get("high_school_id")),
  subjectId: sanitizeId(params.get("subject_id")),
});

export const filtersToSearchParams = (filters: AnalyticsFilters) => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.highSchoolId) params.set("high_school_id", filters.highSchoolId);
  if (filters.subjectId) params.set("subject_id", filters.subjectId);
  return params;
};
