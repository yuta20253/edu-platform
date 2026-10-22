import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { formatTokyoDate, tokyoToday } from "./tokyoDate";

describe("formatTokyoDate", () => {
  it("日本時間の日付を yyyy-MM-dd で返す", () => {
    expect(formatTokyoDate(new Date("2026-10-18T03:00:00Z"))).toBe(
      "2026-10-18",
    );
  });

  it("UTC では前日でも、日本時間で日付が変わっていれば翌日を返す", () => {
    expect(formatTokyoDate(new Date("2026-10-17T15:30:00Z"))).toBe(
      "2026-10-18",
    );
  });

  it("UTC では同日でも、日本時間で日付が変わっていなければその日を返す", () => {
    expect(formatTokyoDate(new Date("2026-10-17T14:59:59Z"))).toBe(
      "2026-10-17",
    );
  });
});

describe("tokyoToday", () => {
  it("日本時間の今日を端末のタイムゾーンの 0 時として返す", () => {
    const today = tokyoToday(new Date("2026-10-17T15:30:00Z"));

    expect(format(today, "yyyy-MM-dd")).toBe("2026-10-18");
    expect(format(today, "HH:mm")).toBe("00:00");
  });
});
