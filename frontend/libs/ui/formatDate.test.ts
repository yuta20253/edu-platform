import { describe, it, expect } from "vitest";
import { formatDateTime } from "./formatDate";

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
