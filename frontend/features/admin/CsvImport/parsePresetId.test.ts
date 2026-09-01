import { describe, expect, it } from "vitest";
import { parsePresetId } from "./parsePresetId";

describe("parsePresetId", () => {
  it("正の整数文字列は数値に変換される", () => {
    expect(parsePresetId("7")).toBe(7);
  });

  it("nullはnullを返す", () => {
    expect(parsePresetId(null)).toBeNull();
  });

  it("undefinedはnullを返す", () => {
    expect(parsePresetId(undefined)).toBeNull();
  });

  it("空文字列はnullを返す", () => {
    expect(parsePresetId("")).toBeNull();
  });

  it("数値でない文字列（例: abc）はnullを返す", () => {
    expect(parsePresetId("abc")).toBeNull();
  });

  it("0はnullを返す", () => {
    expect(parsePresetId("0")).toBeNull();
  });

  it("負の数値はnullを返す", () => {
    expect(parsePresetId("-1")).toBeNull();
  });

  it("小数はnullを返す", () => {
    expect(parsePresetId("1.5")).toBeNull();
  });

  it("数値の後ろに文字が続く場合はnullを返す（Numberが型変換に失敗するため）", () => {
    expect(parsePresetId("1abc")).toBeNull();
  });
});
