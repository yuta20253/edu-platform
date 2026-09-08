import { describe, it, expect } from "vitest";
import { isNumericId } from "./routeParams";

describe("isNumericId", () => {
  it("数字のみの文字列は true を返す", () => {
    expect(isNumericId("1")).toBe(true);
    expect(isNumericId("12345")).toBe(true);
  });

  it("数字以外を含む文字列は false を返す", () => {
    expect(isNumericId("abc")).toBe(false);
    expect(isNumericId("1a")).toBe(false);
    expect(isNumericId("1.5")).toBe(false);
    expect(isNumericId("-1")).toBe(false);
    expect(isNumericId("")).toBe(false);
    expect(isNumericId(" 1")).toBe(false);
  });
});
