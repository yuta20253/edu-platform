import { describe, expect, it } from "vitest";
import type { InterviewRequest } from "@/types/interview/interviewRequest";
import {
  formatInterviewTime,
  groupInterviewsByDate,
  interviewDetailHref,
  isScheduled,
} from "./calendarUtils";
import type { ScheduledInterview } from "./types";

// 実行環境のタイムゾーンに依存しないよう、ローカル日時から ISO 文字列を作る
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

const interview = (
  overrides: Partial<ScheduledInterview> = {},
): ScheduledInterview => ({
  id: 1,
  status: "confirmed",
  initiator_role: "student",
  reason_category: "career",
  reason_detail: "進路について相談したい",
  scheduled_at: at(6, 10),
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  lock_version: 0,
  created_at: at(1, 9),
  student_id: 2,
  student_name: "山田太郎",
  teacher_id: 3,
  teacher_name: "佐藤先生",
  ...overrides,
});

describe("isScheduled", () => {
  it("scheduled_at があれば true を返す", () => {
    expect(isScheduled(interview())).toBe(true);
  });

  it("scheduled_at が null なら false を返す", () => {
    const unscheduled: InterviewRequest = {
      ...interview(),
      scheduled_at: null,
    };
    expect(isScheduled(unscheduled)).toBe(false);
  });
});

describe("groupInterviewsByDate", () => {
  it("scheduled_at の日付(YYYY/MM/DD)ごとにまとめ、元の並び順を保つ", () => {
    const grouped = groupInterviewsByDate([
      interview({ id: 1, scheduled_at: at(6, 10) }),
      interview({ id: 2, scheduled_at: at(6, 15, 30) }),
      interview({ id: 3, scheduled_at: at(8, 9) }),
    ]);

    expect(grouped["2026/10/06"].map((i) => i.id)).toEqual([1, 2]);
    expect(grouped["2026/10/08"].map((i) => i.id)).toEqual([3]);
    expect(grouped["2026/10/07"]).toBeUndefined();
  });

  it("日付の境界(0:00 と 23:59)をその日にまとめる", () => {
    const grouped = groupInterviewsByDate([
      interview({ id: 1, scheduled_at: at(6, 0) }),
      interview({ id: 2, scheduled_at: at(6, 23, 59) }),
    ]);

    expect(grouped["2026/10/06"].map((i) => i.id)).toEqual([1, 2]);
  });
});

describe("formatInterviewTime", () => {
  it("予定時刻を HH:mm で返す", () => {
    expect(formatInterviewTime(at(6, 9, 5))).toBe("09:05");
  });
});

describe("interviewDetailHref", () => {
  it("教員の面談詳細画面のパスを返す", () => {
    expect(interviewDetailHref(30)).toBe("/teacher/interviews/30");
  });
});
