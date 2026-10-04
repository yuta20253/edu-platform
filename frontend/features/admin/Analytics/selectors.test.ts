import { describe, expect, it } from "vitest";
import { sortHighSchoolUsage, uniqueSubjects } from "./selectors";
import type { HighSchoolUsage } from "./types";

const row = (overrides: Partial<HighSchoolUsage>): HighSchoolUsage => ({
  high_school_id: 1,
  high_school_name: "A高校",
  student_count: 100,
  active_student_count: 50,
  active_rate: 50,
  answer_count: 1000,
  accuracy_rate: 60,
  ...overrides,
});

describe("sortHighSchoolUsage", () => {
  const rows = [
    row({ high_school_id: 1, high_school_name: "A高校", active_rate: 70 }),
    row({ high_school_id: 2, high_school_name: "B高校", active_rate: 20 }),
    row({ high_school_id: 3, high_school_name: "C高校", active_rate: 45 }),
  ];

  it("アクティブ率の昇順に並べ替える", () => {
    const sorted = sortHighSchoolUsage(rows, "active_rate", "asc");
    expect(sorted.map((r) => r.high_school_id)).toEqual([2, 3, 1]);
  });

  it("降順にも並べ替えられる", () => {
    const sorted = sortHighSchoolUsage(rows, "active_rate", "desc");
    expect(sorted.map((r) => r.high_school_id)).toEqual([1, 3, 2]);
  });

  it("高校名は日本語の文字列順で並べ替える", () => {
    const sorted = sortHighSchoolUsage(rows, "high_school_name", "desc");
    expect(sorted.map((r) => r.high_school_name)).toEqual([
      "C高校",
      "B高校",
      "A高校",
    ]);
  });

  it("同値の場合は元の並びを保つ(安定ソート)", () => {
    const same = [
      row({ high_school_id: 1, answer_count: 10 }),
      row({ high_school_id: 2, answer_count: 10 }),
    ];
    const sorted = sortHighSchoolUsage(same, "answer_count", "asc");
    expect(sorted.map((r) => r.high_school_id)).toEqual([1, 2]);
  });

  it("元の配列を破壊しない", () => {
    const original = [...rows];
    sortHighSchoolUsage(rows, "active_rate", "asc");
    expect(rows).toEqual(original);
  });
});

describe("uniqueSubjects", () => {
  it("講座の科目をIDで重複排除し、ID順に返す", () => {
    const courses = [
      { subject: { id: 2, name: "数学" } },
      { subject: { id: 1, name: "英語" } },
      { subject: { id: 2, name: "数学" } },
    ];
    expect(uniqueSubjects(courses)).toEqual([
      { id: 1, name: "英語" },
      { id: 2, name: "数学" },
    ]);
  });

  it("科目が未設定(null)の講座は無視する", () => {
    expect(uniqueSubjects([{ subject: null }])).toEqual([]);
  });
});
