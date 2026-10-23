import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { tokyoTodayAsLocalDate } from "./tokyoDate";

const toDateString = (date: Date) => format(date, "yyyy-MM-dd");

describe("tokyoTodayAsLocalDate", () => {
  it("日本時間の今日を返す", () => {
    const today = tokyoTodayAsLocalDate(new Date("2026-10-18T03:00:00Z"));

    expect(toDateString(today)).toBe("2026-10-18");
  });

  it("UTC では前日でも、日本時間で日付が変わっていれば翌日を返す", () => {
    const today = tokyoTodayAsLocalDate(new Date("2026-10-17T15:30:00Z"));

    expect(toDateString(today)).toBe("2026-10-18");
  });

  it("UTC では同日でも、日本時間で日付が変わっていなければその日を返す", () => {
    const today = tokyoTodayAsLocalDate(new Date("2026-10-17T14:59:59Z"));

    expect(toDateString(today)).toBe("2026-10-17");
  });

  it("端末が日本以外のタイムゾーンでも、日本時間の日付を端末の 0 時として返す", () => {
    // vitest.setup.ts で Asia/Tokyo に固定しているため、海外の端末を再現する
    const originalTZ = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      // ロサンゼルスでは 10/17 の夜、日本時間では 10/18
      const today = tokyoTodayAsLocalDate(new Date("2026-10-18T03:00:00Z"));

      expect(toDateString(today)).toBe("2026-10-18");
      expect(format(today, "HH:mm")).toBe("00:00");
    } finally {
      process.env.TZ = originalTZ;
    }
  });
});
