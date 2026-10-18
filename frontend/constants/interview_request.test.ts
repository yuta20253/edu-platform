import { describe, expect, it } from "vitest";
import {
  interviewReasonCategories,
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
  interviewStatuses,
} from "./interview_request";

describe("interviewStatusDefinitions", () => {
  it("各ステータスに対応する日本語ラベルを返す", () => {
    expect(interviewStatusDefinitions.requested.label).toBe("申請中");
    expect(interviewStatusDefinitions.scheduling.label).toBe("日程調整中");
    expect(interviewStatusDefinitions.confirmed.label).toBe("確定");
    expect(interviewStatusDefinitions.completed.label).toBe("完了");
    expect(interviewStatusDefinitions.cancelled.label).toBe("キャンセル");
  });
});

describe("interviewStatuses", () => {
  it("バックエンドの enum と同じ順序でステータスを返す", () => {
    expect(interviewStatuses).toEqual([
      "requested",
      "scheduling",
      "confirmed",
      "completed",
      "cancelled",
    ]);
  });
});

describe("interviewReasonCategories", () => {
  it("バックエンドの enum と同じ順序で相談カテゴリを返す", () => {
    expect(interviewReasonCategories).toEqual([
      "study_method",
      "study_plan",
      "academic_performance",
      "career",
      "school_life",
      "mental",
      "other",
    ]);
  });

  it("すべての相談カテゴリに日本語ラベルがある", () => {
    expect(
      interviewReasonCategories.map((c) => interviewReasonCategoryLabel[c]),
    ).toEqual([
      "勉強方法",
      "学習計画",
      "成績",
      "進路",
      "学校生活",
      "心身の悩み",
      "その他",
    ]);
  });
});
