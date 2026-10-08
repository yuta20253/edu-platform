import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Courses } from "./index";

const useFetchCoursesMock = vi.fn();

vi.mock("./hooks/useFetchCourses", () => ({
  useFetchCourses: () => useFetchCoursesMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("Courses", () => {
  beforeEach(() => {
    useFetchCoursesMock.mockReset();
  });

  it("取得中はスケルトンを表示する", () => {
    useFetchCoursesMock.mockReturnValue({ data: null, error: false });

    render(<Courses />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に失敗したらエラーと再試行ボタンを表示し、押すと onRetry が呼ばれる", () => {
    const onRetry = vi.fn();
    useFetchCoursesMock.mockReturnValue({ data: null, error: true, onRetry });

    render(<Courses />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchCoursesMock.mockReturnValue({
      data: { courses: [], meta: {} },
      error: false,
    });

    render(<Courses />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
