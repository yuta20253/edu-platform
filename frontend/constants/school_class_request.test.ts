import { describe, expect, it } from "vitest";
import {
  schoolClassRequestActionLabel,
  schoolClassRequestActions,
  schoolClassRequestStatusDefinitions,
  schoolClassRequestStatuses,
} from "./school_class_request";

describe("schoolClassRequestStatusDefinitions", () => {
  it("各ステータスに対応する日本語ラベルを返す", () => {
    expect(schoolClassRequestStatusDefinitions.pending.label).toBe("承認待ち");
    expect(schoolClassRequestStatusDefinitions.approved.label).toBe("承認");
    expect(schoolClassRequestStatusDefinitions.rejected.label).toBe("却下");
    expect(schoolClassRequestStatusDefinitions.cancelled.label).toBe("取消");
  });
});

describe("schoolClassRequestStatuses", () => {
  it("バックエンドの enum と同じ順序でステータスを返す", () => {
    expect(schoolClassRequestStatuses).toEqual([
      "pending",
      "approved",
      "rejected",
      "cancelled",
    ]);
  });
});

describe("schoolClassRequestActionLabel", () => {
  it("各種別に対応する日本語ラベルを返す", () => {
    expect(schoolClassRequestActionLabel.creation).toBe("新設");
    expect(schoolClassRequestActionLabel.modification).toBe("改名");
    expect(schoolClassRequestActionLabel.deletion).toBe("削除");
  });
});

describe("schoolClassRequestActions", () => {
  it("バックエンドの enum と同じ順序で種別を返す", () => {
    expect(schoolClassRequestActions).toEqual([
      "creation",
      "modification",
      "deletion",
    ]);
  });
});
