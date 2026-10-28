import { describe, expect, it } from "vitest";
import { PRIORITY, toPriorityValue } from "./constants";

describe("toPriorityValue", () => {
  // キーの綴りは Rails の enum(rails/app/models/draft_task.rb)と同じ。
  // 5 つすべてを確かめて、綴りの食い違いを検知する。
  it.each([
    ["very_low", PRIORITY.VERY_LOW],
    ["low", PRIORITY.LOW],
    ["normal", PRIORITY.NORMAL],
    ["high", PRIORITY.HIGH],
    ["very_high", PRIORITY.VERY_HIGH],
  ])("API の文字列 %s は、フォームの値 %i に変換する", (key, expected) => {
    expect(toPriorityValue(key)).toBe(expected);
  });

  it.each([1, 2, 3, 4, 5])("1〜5 の数値 %i はそのまま使う", (value) => {
    expect(toPriorityValue(value)).toBe(value);
  });

  it.each([
    ["範囲外の数値 0", 0],
    ["範囲外の数値 6", 6],
    ["NaN", NaN],
    ['数値の文字列 "4"', "4"],
    ["未知の文字列", "urgent"],
    ["空文字", ""],
    ["Object のプロパティ名(toString)", "toString"],
    ["null", null],
    ["undefined", undefined],
  ])("%s は「普通」にする", (_name, value) => {
    expect(toPriorityValue(value)).toBe(PRIORITY.NORMAL);
  });
});
