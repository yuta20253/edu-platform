import { describe, expect, it } from "vitest";
import { priorityDefinitions } from "./priority";

describe("priorityDefinitions", () => {
  it("StatusBadge用に優先度のlabel/colorを1つのテーブルにまとめて返す", () => {
    expect(priorityDefinitions).toEqual({
      very_low: { label: "とても低い", color: "default" },
      low: { label: "低い", color: "default" },
      normal: { label: "普通", color: "info" },
      high: { label: "高い", color: "warning" },
      very_high: { label: "とても高い", color: "error" },
    });
  });
});
