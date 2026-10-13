import { describe, expect, it } from "vitest";
import { colors } from "@/app/theme/colors";
import { formatCorrectRate, getCorrectRateColor } from "./correctRate";

describe("formatCorrectRate", () => {
  it("正答率を%付きで返す", () => {
    expect(formatCorrectRate(66.7)).toBe("66.7%");
  });

  it("未解答(null)のときは「-」を返す", () => {
    expect(formatCorrectRate(null)).toBe("-");
  });
});

describe("getCorrectRateColor", () => {
  it("80%以上は成功色を返す", () => {
    expect(getCorrectRateColor(80)).toBe(colors.status.success);
  });

  it("50%未満はエラー色を返す", () => {
    expect(getCorrectRateColor(49.9)).toBe(colors.status.error);
  });

  it("50%以上80%未満は通常の文字色を返す", () => {
    expect(getCorrectRateColor(50)).toBe(colors.text.primary);
    expect(getCorrectRateColor(79.9)).toBe(colors.text.primary);
  });

  it("未解答(null)のときは控えめな文字色を返す", () => {
    expect(getCorrectRateColor(null)).toBe(colors.text.muted);
  });
});
