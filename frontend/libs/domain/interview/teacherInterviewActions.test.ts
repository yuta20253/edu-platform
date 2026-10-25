import { describe, expect, it } from "vitest";
import { teacherInterviewActions } from "./teacherInterviewActions";

describe("teacherInterviewActions", () => {
  it("生徒からの申請中は、日程確定と却下ができる", () => {
    expect(
      teacherInterviewActions({
        status: "requested",
        initiator_role: "student",
      }),
    ).toEqual({ canSchedule: true, canComplete: false, cancelKind: "reject" });
  });

  it("教員からの申請中は、日程確定とキャンセルができる", () => {
    expect(
      teacherInterviewActions({
        status: "requested",
        initiator_role: "teacher",
      }),
    ).toEqual({ canSchedule: true, canComplete: false, cancelKind: "cancel" });
  });

  it.each(["student", "teacher"] as const)(
    "日程調整中(申請元: %s)は、日程確定とキャンセルができる",
    (initiator_role) => {
      expect(
        teacherInterviewActions({ status: "scheduling", initiator_role }),
      ).toEqual({
        canSchedule: true,
        canComplete: false,
        cancelKind: "cancel",
      });
    },
  );

  it("確定は、完了とキャンセルができる(日程の確定はできない)", () => {
    expect(
      teacherInterviewActions({
        status: "confirmed",
        initiator_role: "student",
      }),
    ).toEqual({ canSchedule: false, canComplete: true, cancelKind: "cancel" });
  });

  it.each(["completed", "cancelled"] as const)(
    "%s はどの操作もできない",
    (status) => {
      expect(
        teacherInterviewActions({ status, initiator_role: "student" }),
      ).toEqual({ canSchedule: false, canComplete: false, cancelKind: null });
    },
  );
});
