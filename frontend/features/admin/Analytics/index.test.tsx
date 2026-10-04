import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Analytics } from "./index";
import { useFetchAnalytics } from "./hooks/useFetchAnalytics";

vi.mock("./hooks/useFetchAnalytics", () => ({
  useFetchAnalytics: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const hookResult = {
  data: null,
  error: false,
  validationErrors: [],
  isInitialLoading: true,
  isRefetching: false,
  filters: { from: "", to: "", highSchoolId: "", subjectId: "" },
  highSchoolOptions: [],
  subjectOptions: [],
  onFiltersChange: vi.fn(),
  onRetry: vi.fn(),
};

describe("Analytics(コンテナ)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useFetchAnalytics の結果を Presenter に渡して描画する", () => {
    vi.mocked(useFetchAnalytics).mockReturnValue(hookResult);
    render(<Analytics />);

    expect(
      screen.getByRole("heading", { name: "分析・レポート" }),
    ).toBeVisible();
    expect(screen.getByLabelText("読み込み中")).toBeVisible();
  });

  it("エラー時は再試行ボタンから onRetry を呼べる", () => {
    const onRetry = vi.fn();
    vi.mocked(useFetchAnalytics).mockReturnValue({
      ...hookResult,
      isInitialLoading: false,
      error: true,
      onRetry,
    });
    render(<Analytics />);

    screen.getByRole("button", { name: "再試行" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
