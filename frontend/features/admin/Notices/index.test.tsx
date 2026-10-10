import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Notices } from "./index";

const useFetchNoticesMock = vi.fn();

vi.mock("./hooks/useFetchNotices", () => ({
  useFetchNotices: () => useFetchNoticesMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("Notices", () => {
  beforeEach(() => {
    useFetchNoticesMock.mockReset();
  });

  it("取得中はスケルトンを表示し、スピナーは表示しない", () => {
    useFetchNoticesMock.mockReturnValue({ data: null, error: false });

    const { container } = render(<Notices />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("取得に失敗したらエラーを表示し、再試行で onRetry が呼ばれる", () => {
    const onRetry = vi.fn();
    useFetchNoticesMock.mockReturnValue({ data: null, error: true, onRetry });

    render(<Notices />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchNoticesMock.mockReturnValue({ data: {}, error: false });

    render(<Notices />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
