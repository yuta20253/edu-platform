import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouteError } from "./RouteError";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("RouteError", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("固定の文言を出し、error.message は表示しない", () => {
    render(<RouteError error={new Error("secret detail")} reset={vi.fn()} />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
    expect(screen.queryByText("secret detail")).not.toBeInTheDocument();
  });

  it("再試行で router.refresh と reset が呼ばれる", () => {
    const reset = vi.fn();
    render(<RouteError error={new Error("x")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
