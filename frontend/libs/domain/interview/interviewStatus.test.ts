import { describe, expect, it } from "vitest";
import { interviewStatuses } from "@/constants/interview_request";
import { isActiveInterviewStatus, isInterviewStatus } from "./interviewStatus";

describe("isInterviewStatus", () => {
  it.each(interviewStatuses)("%s は true を返す", (status) => {
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
