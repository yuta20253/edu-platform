import { describe, expect, it } from "vitest";
import {
  INTERVIEW_REASON_CATEGORIES,
  INTERVIEW_STATUSES,
  isActiveInterviewStatus,
  isInterviewStatus,
} from "./interviewRequest";

describe("isInterviewStatus", () => {
  it.each(INTERVIEW_STATUSES)("%s は true を返す", (status) => {
    expect(isInterviewStatus(status)).toBe(true);
  });

  it("定義外の値は false を返す", () => {
    expect(isInterviewStatus("unknown")).toBe(false);
  });
});

describe("isActiveInterviewStatus", () => {
  it.each(["requested", "scheduling", "confirmed"] as const)(
    "%s は進行中として true を返す",
    (status) => {
      expect(isActiveInterviewStatus(status)).toBe(true);
    },
  );

  it.each(["completed", "cancelled"] as const)(
    "%s は false を返す",
    (status) => {
      expect(isActiveInterviewStatus(status)).toBe(false);
    },
  );
});

describe("INTERVIEW_REASON_CATEGORIES", () => {
  it("Rails の enum と同じ順序で相談カテゴリを返す", () => {
    expect(INTERVIEW_REASON_CATEGORIES).toEqual([
      "study_method",
      "study_plan",
      "academic_performance",
      "career",
      "school_life",
      "mental",
      "other",
    ]);
  });
});
