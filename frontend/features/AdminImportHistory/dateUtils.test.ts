import { describe, it, expect } from "vitest";
import { dateToInput, dateToParam, formatDateTime } from "./dateUtils";

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
});

describe("formatDateTime", () => {
  it("ISO8601文字列をyyyy/MM/dd HH:mm形式に変換する", () => {
    const result = formatDateTime("2026-08-01T10:30:00+09:00");
    expect(result).toBe("2026/08/01 10:30");
  });

  it("不正な値の場合は「-」を返す", () => {
    expect(formatDateTime("")).toBe("-");
    expect(formatDateTime("invalid")).toBe("-");
  });
});
