import { describe, expect, it } from "vitest";
import { normalizeStudentNumber } from "./normalizeStudentNumber";

describe("normalizeStudentNumber", () => {
  it("全角アルファベット・数字を半角に変換する", () => {
    expect(normalizeStudentNumber("ＡＢ１２")).toBe("AB12");
  });

  it("全角ハイフンを半角ハイフンに変換する", () => {
    expect(normalizeStudentNumber("ＡＢ１２－ＣＤ３４５６")).toBe(
      "AB12-CD3456",
    );
  });

  it("IME変換でハイフンの代わりに入力されやすい長音符(ー)も半角ハイフンに変換する", () => {
    expect(normalizeStudentNumber("AB12ーCD3456")).toBe("AB12-CD3456");
  });

  it("既に半角の文字列はそのまま返す", () => {
    expect(normalizeStudentNumber("AB12-CD3456")).toBe("AB12-CD3456");
  });
});
