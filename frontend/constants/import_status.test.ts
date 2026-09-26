import { describe, expect, it } from "vitest";
import {
  importModeLabel,
  importStatusColor,
  importStatusDefinitions,
  importStatusLabel,
} from "./import_status";

describe("importStatusLabel", () => {
  it("各ステータスに対応する日本語ラベルを返す", () => {
    expect(importStatusLabel.pending).toBe("待機中");
    expect(importStatusLabel.processing).toBe("処理中");
    expect(importStatusLabel.completed).toBe("完了");
    expect(importStatusLabel.failed).toBe("失敗");
  });
});

describe("importStatusColor", () => {
  it("各ステータスに対応する MUI の color を返す", () => {
    expect(importStatusColor.pending).toBe("warning");
    expect(importStatusColor.processing).toBe("info");
    expect(importStatusColor.completed).toBe("success");
    expect(importStatusColor.failed).toBe("error");
  });
});

describe("importStatusDefinitions", () => {
  it("StatusBadge用にlabel/colorを1つのテーブルにまとめて返す", () => {
    expect(importStatusDefinitions.pending).toEqual({
      label: "待機中",
      color: "warning",
    });
    expect(importStatusDefinitions.processing).toEqual({
      label: "処理中",
      color: "info",
    });
    expect(importStatusDefinitions.completed).toEqual({
      label: "完了",
      color: "success",
    });
    expect(importStatusDefinitions.failed).toEqual({
      label: "失敗",
      color: "error",
    });
  });
});

describe("importModeLabel", () => {
  it("各モードに対応する日本語ラベルを返す", () => {
    expect(importModeLabel.append).toBe("追加");
    expect(importModeLabel.overwrite).toBe("上書き");
  });
});
