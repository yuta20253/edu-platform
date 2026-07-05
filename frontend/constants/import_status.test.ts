import { describe, expect, it } from "vitest";
import { importStatusLabel } from "./import_status";

describe("importStatusLabel", () => {
  it("各ステータスに対応する日本語ラベルを返す", () => {
    expect(importStatusLabel.pending).toBe("待機中");
    expect(importStatusLabel.processing).toBe("処理中");
    expect(importStatusLabel.completed).toBe("完了");
    expect(importStatusLabel.failed).toBe("失敗");
  });
});
