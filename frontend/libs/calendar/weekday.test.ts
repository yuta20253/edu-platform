import { describe, expect, it } from "vitest";
import { colors } from "@/app/theme/colors";
import { WEEKDAY_LABELS, weekdayColor } from "./weekday";

describe("WEEKDAY_LABELS", () => {
  it("日曜始まりの7曜日を返す", () => {
    expect(WEEKDAY_LABELS).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });
});

describe("weekdayColor", () => {
  it("日曜は赤、土曜は青、平日は通常の文字色を返す", () => {
    expect(weekdayColor(0)).toBe(colors.status.error);
    expect(weekdayColor(6)).toBe(colors.status.info);
    expect(weekdayColor(3)).toBe(colors.text.secondary);
  });
});
