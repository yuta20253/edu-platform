import { describe, it, expect } from "vitest";
import { dateToInput, dateToParam } from "./dateUtils";

describe("dateToInput", () => {
  it("yyyy-MM-dd形式の文字列をDateに変換する", () => {
    const result = dateToInput("2026-08-01");
    expect(result).toEqual(new Date(2026, 7, 1));
  });

  it("空文字の場合はnullを返す", () => {
    expect(dateToInput("")).toBeNull();
  });
});

describe("dateToParam", () => {
  it("Dateをyyyy-MM-dd形式の文字列に変換する", () => {
    expect(dateToParam(new Date(2026, 7, 1))).toBe("2026-08-01");
  });

  it("nullの場合は空文字を返す", () => {
    expect(dateToParam(null)).toBe("");
  });

  it("Invalid Dateの場合は空文字を返す", () => {
    // DatePickerで日付を入力中、桁が揃うまでの間はInvalid Dateが
    // 渡ってくることがある（例: "01"を入力しようとして"0"だけ打った瞬間）。
    expect(dateToParam(new Date(NaN))).toBe("");
  });
});
