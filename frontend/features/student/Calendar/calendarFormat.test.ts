import { describe, expect, it } from "vitest";
import {
  formatDayLabel,
  formatDayLabelWithWeekday,
  formatMonthLabel,
  toApiDate,
  toDateKey,
  toMonthKey,
} from "./calendarFormat";

const date = new Date(2026, 9, 6);

describe("calendarFormat", () => {
  it("formatMonthLabel は月の見出しを「YYYY年M月」で返す", () => {
    expect(formatMonthLabel(date)).toBe("2026年10月");
  });

  it("formatDayLabel は「M月d日」で返す(ゼロ埋めしない)", () => {
    expect(formatDayLabel(new Date(2026, 8, 3))).toBe("9月3日");
  });

  it("formatDayLabelWithWeekday は日本語の曜日付きで返す", () => {
    expect(formatDayLabelWithWeekday(date)).toBe("10月6日(火)");
  });

  it("toApiDate は API に渡す YYYY-MM-DD を返す", () => {
    expect(toApiDate(new Date(2026, 8, 3))).toBe("2026-09-03");
  });

  it("toDateKey は Rails のレスポンスと照合する YYYY/MM/DD を返す", () => {
    expect(toDateKey(new Date(2026, 8, 3))).toBe("2026/09/03");
  });

  it("toMonthKey は月単位のキーを YYYY-MM で返す", () => {
    expect(toMonthKey(date)).toBe("2026-10");
  });
});
