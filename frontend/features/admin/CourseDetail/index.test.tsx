import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseDetail } from "./index";

const useFetchCourseDetailMock = vi.fn();

vi.mock("./hooks/useFetchCourseDetail", () => ({
  useFetchCourseDetail: () => useFetchCourseDetailMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("CourseDetail", () => {
  beforeEach(() => {
    useFetchCourseDetailMock.mockReset();
  });

  it("取得中はスケルトンを表示し、Presenter とスピナーは表示しない", () => {
    useFetchCourseDetailMock.mockReturnValue({
      course: null,
      loading: true,
      error: false,
    });

    const { container } = render(<CourseDetail courseId={1} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に失敗したらエラーを表示し、再試行で retry が呼ばれる", () => {
    const retry = vi.fn();
    useFetchCourseDetailMock.mockReturnValue({
      course: null,
      loading: false,
      error: true,
      retry,
    });

    render(<CourseDetail courseId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchCourseDetailMock.mockReturnValue({
      course: {},
      loading: false,
      error: false,
    });

    render(<CourseDetail courseId={1} />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
