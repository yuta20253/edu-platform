import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Course } from "@/types/tasks/course";
import { CourseSelector } from "./CourseSelector";

const course = (id: number): Course => ({
  id,
  level_number: id,
  level_name: "標準",
  description: `説明${id}`,
  units: [{ id: id * 10, course_id: id, unit_name: `単元${id}` }],
});

const courses = [1, 2, 3, 4].map(course);

const baseProps = {
  courses,
  displayedCourses: courses.slice(0, 3),
  selectedCourse: null,
  selectedCourseId: null,
  showAllCourses: false,
  fetchCourse: vi.fn(),
  setSelectedCourseId: vi.fn(),
  onToggleShowAll: vi.fn(),
  selectedUnitIds: [],
  handleToggleUnit: vi.fn(),
};

describe("CourseSelector", () => {
  it("講座が4件以上のとき「もっと見る」が表示され、押すと onToggleShowAll が呼ばれる", () => {
    const onToggleShowAll = vi.fn();
    render(<CourseSelector {...baseProps} onToggleShowAll={onToggleShowAll} />);

    fireEvent.click(screen.getByRole("button", { name: "もっと見る" }));

    expect(onToggleShowAll).toHaveBeenCalledTimes(1);
  });

  it("全件表示中は「閉じる」が表示される", () => {
    render(
      <CourseSelector
        {...baseProps}
        showAllCourses
        displayedCourses={courses}
      />,
    );
    expect(screen.getByRole("button", { name: "閉じる" })).toBeInTheDocument();
  });

  it("講座が3件以下のときは「もっと見る」が表示されない", () => {
    render(
      <CourseSelector
        {...baseProps}
        courses={courses.slice(0, 3)}
        displayedCourses={courses.slice(0, 3)}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "もっと見る" }),
    ).not.toBeInTheDocument();
  });

  it("学習開始済みの単元はチェックできず、ラベルに注記が付く", () => {
    render(
      <CourseSelector
        {...baseProps}
        selectedCourseId={1}
        selectedCourse={courses[0]}
        selectedUnitIds={[10]}
        startedUnitIds={new Set([10])}
      />,
    );
    expect(screen.getByLabelText("単元1（学習開始済み）")).toBeDisabled();
  });

  it("単元のチェックを切り替えると handleToggleUnit が呼ばれる", () => {
    const handleToggleUnit = vi.fn();
    render(
      <CourseSelector
        {...baseProps}
        selectedCourseId={2}
        selectedCourse={courses[1]}
        handleToggleUnit={handleToggleUnit}
      />,
    );
    fireEvent.click(screen.getByLabelText("単元2"));
    expect(handleToggleUnit).toHaveBeenCalledWith(20);
  });
});
