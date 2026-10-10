import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnitDetail } from "./index";

const useFetchUnitDetailMock = vi.fn();

vi.mock("./hooks/useFetchUnitDetail", () => ({
  useFetchUnitDetail: () => useFetchUnitDetailMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("UnitDetail", () => {
  beforeEach(() => {
    useFetchUnitDetailMock.mockReset();
  });

  it("取得中はスケルトンを表示し、Presenter とスピナーは表示しない", () => {
    useFetchUnitDetailMock.mockReturnValue({
      unit: null,
      loading: true,
      error: false,
    });

    const { container } = render(<UnitDetail courseId={1} unitId={2} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に失敗したらエラーを表示し、再試行で retry が呼ばれる", () => {
    const retry = vi.fn();
    useFetchUnitDetailMock.mockReturnValue({
      unit: null,
      loading: false,
      error: true,
      retry,
    });

    render(<UnitDetail courseId={1} unitId={2} />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchUnitDetailMock.mockReturnValue({
      unit: {},
      loading: false,
      error: false,
    });

    render(<UnitDetail courseId={1} unitId={2} />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
