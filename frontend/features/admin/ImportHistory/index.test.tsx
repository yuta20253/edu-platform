import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportHistory } from "./index";

const useFetchHistoriesMock = vi.fn();

vi.mock("./hooks/useFetchHistories", () => ({
  useFetchHistories: () => useFetchHistoriesMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("ImportHistory", () => {
  beforeEach(() => {
    useFetchHistoriesMock.mockReset();
  });

  it("取得に失敗したらエラーを表示し、再試行で onRetry が呼ばれる", () => {
    const onRetry = vi.fn();
    useFetchHistoriesMock.mockReturnValue({ data: null, error: true, onRetry });

    render(<ImportHistory />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("取得中は Presenter を表示しない", () => {
    useFetchHistoriesMock.mockReturnValue({ data: null, error: false });

    render(<ImportHistory />);

    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchHistoriesMock.mockReturnValue({ data: {}, error: false });

    render(<ImportHistory />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
