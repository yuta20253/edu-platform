import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMonthWeeks, getFetchRange, getThisMonth } from "./monthGrid";
import { toDateKey } from "./calendarFormat";

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
