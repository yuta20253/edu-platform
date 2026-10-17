import { describe, expect, it } from "vitest";
import { isOverdue } from "./dueDate";

const today = new Date(2026, 9, 14);

describe("isOverdue", () => {
  it("未完了で期限が今日より前なら期限切れ", () => {
    expect(isOverdue("2026/10/13", "in_progress", today)).toBe(true);
  });

  it("期限が今日なら期限切れではない", () => {
    expect(isOverdue("2026/10/14", "not_started", today)).toBe(false);
  });

  it("完了済みなら期限を過ぎていても期限切れではない", () => {
    expect(isOverdue("2026/10/01", "completed", today)).toBe(false);
  });

  it("期限が未設定なら期限切れではない", () => {
    expect(isOverdue(null, "in_progress", today)).toBe(false);
  });
});
