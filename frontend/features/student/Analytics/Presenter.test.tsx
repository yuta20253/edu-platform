import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Course } from "@/types/tasks/course";
import type { AnalyticsType } from "./types";

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
  data: null,
  loading: false,
};

describe("AnalyticsPresenter", () => {
  it("見出し「学習分析」が表示される", () => {
    render(<Presenter {...baseProps} />);
    expect(screen.getByText("学習分析")).toBeInTheDocument();
  });

  it("ローディング中はスピナーを表示する", () => {
    render(<Presenter {...baseProps} loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("task_completionのデータが渡されると達成タスク数を表示する", () => {
    render(
      <Presenter
        {...baseProps}
        data={{ completed_count: 3, total_count: 5, completion_rate: 60 }}
      />,
    );
    expect(screen.getByText("完了タスク数: 3 / 5")).toBeInTheDocument();
  });

  it("course_rank選択時はデータ未取得なら案内メッセージを表示する", () => {
    render(<Presenter {...baseProps} type="course_rank" />);
    expect(
      screen.getByText("教科とコースを選択してください"),
    ).toBeInTheDocument();
  });

  it("course_rank選択時は教科セレクトが表示される", () => {
    render(<Presenter {...baseProps} type="course_rank" />);
    expect(screen.getByLabelText("教科")).toBeInTheDocument();
  });

  it("教科を選択するとsetSubjectが呼ばれる", () => {
    const setSubject = vi.fn();
    render(
      <Presenter {...baseProps} type="course_rank" setSubject={setSubject} />,
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
      <Presenter
        {...baseProps}
        type="course_rank"
        subject="数学"
        courses={courses}
      />,
    );
    expect(screen.getByLabelText("コース")).toBeInTheDocument();
  });

  it("unit_rankでコース未選択の間は単元セレクトを表示しない", () => {
    render(<Presenter {...baseProps} type="unit_rank" />);
    expect(screen.queryByLabelText("単元")).not.toBeInTheDocument();
  });

  it("unit_rankでコースが選択されると単元セレクトが表示される", () => {
    render(
      <Presenter
        {...baseProps}
        type="unit_rank"
        courseId={1}
        units={[{ id: 10, course_id: 1, unit_name: "一次関数" }]}
      />,
    );
    expect(screen.getByLabelText("単元")).toBeInTheDocument();
  });

  it("順位データがnullの場合は案内メッセージを表示する", () => {
    render(
      <Presenter
        {...baseProps}
        type="course_rank"
        courseId={1}
        data={{ rank: null, total_users: 10 }}
      />,
    );
    expect(
      screen.getByText("対象の学習履歴がまだありません(全10人中)"),
    ).toBeInTheDocument();
  });
});
