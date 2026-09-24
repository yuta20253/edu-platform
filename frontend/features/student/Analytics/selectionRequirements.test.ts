import { describe, it, expect } from "vitest";
import { needsCourse, needsUnit } from "./selectionRequirements";

describe("needsCourse", () => {
  it("course_rankとunit_rankでtrueを返す", () => {
    expect(needsCourse("course_rank")).toBe(true);
    expect(needsCourse("unit_rank")).toBe(true);
  });

  it("それ以外はfalseを返す", () => {
    expect(needsCourse("task_completion")).toBe(false);
    expect(needsCourse("understanding_score")).toBe(false);
    expect(needsCourse("grade_average")).toBe(false);
  });
});

describe("needsUnit", () => {
  it("unit_rankのみtrueを返す", () => {
    expect(needsUnit("unit_rank")).toBe(true);
  });

  it("それ以外はfalseを返す", () => {
    expect(needsUnit("course_rank")).toBe(false);
    expect(needsUnit("task_completion")).toBe(false);
    expect(needsUnit("understanding_score")).toBe(false);
    expect(needsUnit("grade_average")).toBe(false);
  });
});
