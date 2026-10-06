import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMonthWeeks,
  calendarEventHref,
  getFetchRange,
  getThisMonth,
  groupEventsByDate,
} from "./calendarUtils";
import { toDateKey } from "./calendarFormat";
import type { CalendarEvent } from "./types";

describe("buildMonthWeeks", () => {
  it("日曜始まりで、前後月の見切れ日を含む週単位の配列を返す", () => {
    // 2026/10/01 は木曜、2026/10/31 は土曜
    const weeks = buildMonthWeeks(new Date(2026, 9, 15));

    expect(weeks).toHaveLength(5);
    weeks.forEach((week) => expect(week).toHaveLength(7));
    expect(toDateKey(weeks[0][0])).toBe("2026/09/27");
    expect(toDateKey(weeks[4][6])).toBe("2026/10/31");
  });

  it("月末が土曜でない月は翌月の日付で最終週を埋める", () => {
    // 2026/08/01 は土曜、2026/08/31 は月曜
    const weeks = buildMonthWeeks(new Date(2026, 7, 1));

    expect(weeks).toHaveLength(6);
    expect(toDateKey(weeks[0][0])).toBe("2026/07/26");
    expect(toDateKey(weeks[5][6])).toBe("2026/09/05");
  });
});

describe("getFetchRange", () => {
  it("表示グリッドの先頭日〜末尾日を YYYY-MM-DD で返す", () => {
    expect(getFetchRange(new Date(2026, 9, 15))).toEqual({
      from: "2026-09-27",
      to: "2026-10-31",
    });
  });
});

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

describe("getThisMonth", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("現在日時に関わらず、今月1日の0時を返す", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 59));

    expect(getThisMonth()).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
  });
});
