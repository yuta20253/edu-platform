import { describe, expect, it } from "vitest";
import { calendarEventHref, groupEventsByDate } from "./calendarUtils";
import type { CalendarEvent } from "./types";

describe("groupEventsByDate", () => {
  it("date ごとにイベントをまとめ、元の並び順を保つ", () => {
    const events: CalendarEvent[] = [
      {
        type: "task",
        id: 1,
        date: "2026/10/05",
        title: "A",
        status: "not_started",
      },
      {
        type: "goal",
        id: 2,
        date: "2026/10/05",
        title: "B",
        status: "in_progress",
      },
      {
        type: "interview_request",
        id: 3,
        date: "2026/10/08",
        title: "C",
        status: "confirmed",
      },
    ];

    const grouped = groupEventsByDate(events);

    expect(grouped["2026/10/05"].map((e) => e.id)).toEqual([1, 2]);
    expect(grouped["2026/10/08"].map((e) => e.id)).toEqual([3]);
    expect(grouped["2026/10/06"]).toBeUndefined();
  });
});

describe("calendarEventHref", () => {
  it("目標は目標詳細へ遷移する", () => {
    expect(
      calendarEventHref({
        type: "goal",
        id: 10,
        date: "2026/10/05",
        title: "目標",
        status: "not_started",
      }),
    ).toBe("/goals/10");
  });

  it("タスクはタスク詳細へ遷移する", () => {
    expect(
      calendarEventHref({
        type: "task",
        id: 20,
        date: "2026/10/05",
        title: "タスク",
        status: "not_started",
      }),
    ).toBe("/tasks/20");
  });

  it("面談は面談詳細へ遷移する", () => {
    expect(
      calendarEventHref({
        type: "interview_request",
        id: 30,
        date: "2026/10/05",
        title: "面談",
        status: "confirmed",
      }),
    ).toBe("/interviews/30");
  });
});
