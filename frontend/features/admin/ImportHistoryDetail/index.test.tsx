import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportHistoryDetail } from "./index";

const useFetchHistoryDetailMock = vi.fn();

vi.mock("./hooks/useFetchHistoryDetail", () => ({
  useFetchHistoryDetail: () => useFetchHistoryDetailMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("ImportHistoryDetail", () => {
  beforeEach(() => {
    useFetchHistoryDetailMock.mockReset();
  });

  it("取得に失敗したらエラーを表示し、再試行で onRetry が呼ばれる", () => {
    const onRetry = vi.fn();
    useFetchHistoryDetailMock.mockReturnValue({
      data: null,
      error: true,
      onRetry,
    });

    render(<ImportHistoryDetail historyId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("取得中は Presenter を表示しない", () => {
    useFetchHistoryDetailMock.mockReturnValue({ data: null, error: false });

    render(<ImportHistoryDetail historyId={1} />);

    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchHistoryDetailMock.mockReturnValue({ data: {}, error: false });

    render(<ImportHistoryDetail historyId={1} />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
