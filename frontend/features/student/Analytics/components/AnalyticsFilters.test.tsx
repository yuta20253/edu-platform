import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnalyticsFilters } from "./AnalyticsFilters";
import type { Course } from "@/types/tasks/course";
import type { AnalyticsType } from "../types";

const baseProps = {
  type: "task_completion" as AnalyticsType,
  setType: vi.fn(),
  subject: null,
  setSubject: vi.fn(),
  courseId: null,
  setCourseId: vi.fn(),
  unitId: null,
  setUnitId: vi.fn(),
  courses: null,
  units: [],
};

describe("AnalyticsFilters", () => {
  it("course_rank選択時は教科セレクトが表示される", () => {
    render(<AnalyticsFilters {...baseProps} type="course_rank" />);
    expect(screen.getByLabelText("教科")).toBeInTheDocument();
  });

  it("教科を選択するとsetSubjectが呼ばれる", () => {
    const setSubject = vi.fn();
    render(
      <AnalyticsFilters
        {...baseProps}
        type="course_rank"
        setSubject={setSubject}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("教科"));
    fireEvent.click(screen.getByRole("option", { name: "数学" }));

    expect(setSubject).toHaveBeenCalledWith("数学");
  });

  it("コース一覧が渡されるとコース選択が表示される", () => {
    const courses: Course[] = [
      {
        id: 1,
        level_number: 1,
        level_name: "基礎",
        description: "",
        units: [],
      },
    ];
    render(
      <AnalyticsFilters
        {...baseProps}
        type="course_rank"
        subject="数学"
        courses={courses}
      />,
    );
    expect(screen.getByLabelText("コース")).toBeInTheDocument();
  });

  it("教科が未選択の場合はコース一覧が残っていてもコース選択を表示しない", () => {
    const courses: Course[] = [
      {
        id: 1,
        level_number: 1,
        level_name: "基礎",
        description: "",
        units: [],
      },
    ];
    render(
      <AnalyticsFilters
        {...baseProps}
        type="course_rank"
        subject={null}
        courses={courses}
      />,
    );
    expect(screen.queryByLabelText("コース")).not.toBeInTheDocument();
  });

  it("unit_rankでコース未選択の間は単元セレクトを表示しない", () => {
    render(<AnalyticsFilters {...baseProps} type="unit_rank" />);
    expect(screen.queryByLabelText("単元")).not.toBeInTheDocument();
  });

  it("unit_rankでコースが選択されると単元セレクトが表示される", () => {
    render(
      <AnalyticsFilters
        {...baseProps}
        type="unit_rank"
        courseId={1}
        units={[{ id: 10, course_id: 1, unit_name: "一次関数" }]}
      />,
    );
    expect(screen.getByLabelText("単元")).toBeInTheDocument();
  });
});
