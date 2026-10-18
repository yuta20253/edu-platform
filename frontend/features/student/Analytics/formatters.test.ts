import { describe, expect, it } from "vitest";
import { formatStudyMinutes, minutesTrend, rateTrend } from "./formatters";

describe("formatStudyMinutes", () => {
  it.each([
    [0, "0分"],
    [45, "45分"],
    [60, "1時間0分"],
    [210, "3時間30分"],
  ])("%i分は「%s」と表示する", (minutes, expected) => {
    expect(formatStudyMinutes(minutes)).toBe(expected);
  });
});

describe("rateTrend", () => {
  it("上がったときは差をポイントで返す", () => {
    expect(rateTrend(50, 30)).toEqual({ direction: "up", text: "+20pt" });
  });

  it("下がったときはマイナスのポイントで返す", () => {
    expect(rateTrend(55, 62.5)).toEqual({ direction: "down", text: "-7.5pt" });
  });

  it("同じときは ±0pt を返す", () => {
    expect(rateTrend(40, 40)).toEqual({ direction: "flat", text: "±0pt" });
  });

  it("差は小数第1位で丸める", () => {
    expect(rateTrend(66.67, 33.33)).toEqual({
      direction: "up",
      text: "+33.3pt",
    });
  });

  it("前期間のデータがないときは「前期間なし」を返す", () => {
    expect(rateTrend(50, null)).toEqual({ direction: "none", text: "前期間なし" });
  });
});

describe("minutesTrend", () => {
  it("増えたときは増加率を返す", () => {
    expect(minutesTrend(210, 150)).toEqual({ direction: "up", text: "+40%" });
  });

  it("減ったときは減少率を返す", () => {
    expect(minutesTrend(100, 150)).toEqual({
      direction: "down",
      text: "-33.3%",
    });
  });

  it("同じときは ±0% を返す(どちらも0分の場合を含む)", () => {
    expect(minutesTrend(0, 0)).toEqual({ direction: "flat", text: "±0%" });
  });

  it("前期間が0分のときは率を出さず「前期間なし」を返す", () => {
    expect(minutesTrend(30, 0)).toEqual({
      direction: "none",
      text: "前期間なし",
    });
  });
});
