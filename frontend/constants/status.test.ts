import { describe, expect, it } from "vitest";
import { statusDefinitions } from "./status";

describe("statusDefinitions", () => {
  it("StatusBadge用にlabel/colorを1つのテーブルにまとめて返す", () => {
    expect(statusDefinitions.not_started).toEqual({
      label: "未着手",
      color: "default",
    });
    expect(statusDefinitions.in_progress).toEqual({
      label: "進行中",
      color: "info",
    });
    expect(statusDefinitions.completed).toEqual({
      label: "完了",
      color: "success",
    });
  });
});
