import { describe, expect, it } from "vitest";
import { validateTaskDueDate } from "./validateTaskDueDate";

describe("validateTaskDueDate", () => {
  it("目標の期限より後の日付だとエラー文言を返す", () => {
    expect(
      validateTaskDueDate(new Date("2026-09-02"), "2026-09-01"),
    ).toBe("期限は目標の期限以前にしてください");
  });

  it("目標の期限と同じ日付だと true を返す", () => {
    expect(validateTaskDueDate(new Date("2026-09-01"), "2026-09-01")).toBe(
      true,
    );
  });

  it("目標の期限より前の日付だと true を返す", () => {
    expect(validateTaskDueDate(new Date("2026-08-31"), "2026-09-01")).toBe(
      true,
    );
  });

  it("goalDueDate が YYYY/MM/DD 形式(APIの形式)でも比較できる", () => {
    expect(
      validateTaskDueDate(new Date("2026-09-02"), "2026/09/01"),
    ).toBe("期限は目標の期限以前にしてください");
  });

  it("value が null のとき true を返す(必須チェックは別のルールが担当)", () => {
    expect(validateTaskDueDate(null, "2026-09-01")).toBe(true);
  });

  it("goalDueDate が無いとき true を返す(目標の期限が取得できなくても表示をブロックしない)", () => {
    expect(validateTaskDueDate(new Date("2026-09-02"), null)).toBe(true);
    expect(validateTaskDueDate(new Date("2026-09-02"), undefined)).toBe(true);
  });
});
