import { describe, expect, it } from "vitest";
import { calcTrend, formatStudyMinutes } from "./formatters";

describe("calcTrend", () => {
  it("増加時は up と増加率(%)を返す", () => {
    expect(calcTrend({ current: 110, previous: 100 })).toEqual({
      direction: "up",
      percent: 10,
    });
  });

  it("減少時は down と絶対値の減少率(%)を返す", () => {
    expect(calcTrend({ current: 75, previous: 100 })).toEqual({
      direction: "down",
      percent: 25,
    });
  });

  it("増減率は小数1桁に丸める", () => {
    expect(calcTrend({ current: 101, previous: 300 }).percent).toBe(66.3);
  });

  it("同値のときは flat と 0% を返す", () => {
    expect(calcTrend({ current: 50, previous: 50 })).toEqual({
      direction: "flat",
      percent: 0,
    });
  });

  it("前期間が0で増加したときは up で率は算出不能(null)", () => {
    expect(calcTrend({ current: 10, previous: 0 })).toEqual({
      direction: "up",
      percent: null,
    });
  });

  it("前期間も今期間も0のときは flat と 0% を返す", () => {
    expect(calcTrend({ current: 0, previous: 0 })).toEqual({
      direction: "flat",
      percent: 0,
    });
  });
});

describe("formatStudyMinutes", () => {
  it("60分以上は「◯時間◯分」で表示する", () => {
    expect(formatStudyMinutes(125)).toBe("2時間5分");
  });

  it("ちょうど60分の倍数でも分を省略しない", () => {
    expect(formatStudyMinutes(120)).toBe("2時間0分");
  });

  it("60分未満は「◯分」で表示する", () => {
    expect(formatStudyMinutes(45)).toBe("45分");
  });

  it("0分は「0分」と表示する", () => {
    expect(formatStudyMinutes(0)).toBe("0分");
  });

  it("小数は四捨五入して整数分にする", () => {
    expect(formatStudyMinutes(59.6)).toBe("1時間0分");
  });
});
