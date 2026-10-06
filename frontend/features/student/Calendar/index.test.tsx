import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "./index";
import { useCalendar } from "./hooks/useCalendar";

vi.mock("./hooks/useCalendar", () => ({
  useCalendar: vi.fn(),
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

const hookResult = (overrides: Partial<ReturnType<typeof useCalendar>>) => ({
  month: new Date(2026, 9, 1),
  events: [],
  isLoading: false,
  error: null,
  goPrevMonth: vi.fn(),
  goNextMonth: vi.fn(),
  goThisMonth: vi.fn(),
  ...overrides,
});

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 「今日」が表示月に含まれると選択日の初期値が変わるため、実行日に依存しないよう固定する
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("取得エラー時はエラーメッセージを表示する", () => {
    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ error: new Error("failed") }),
    );
    render(<Calendar />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "データの取得に失敗しました",
    );
  });

  it("表示月が変わると選択日がその月の初期値にリセットされる", () => {
    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ month: new Date(2026, 7, 1) }),
    );
    const { rerender } = render(<Calendar />);
    expect(
      screen.getByRole("region", { name: "8月1日(土)の予定" }),
    ).toBeInTheDocument();

    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ month: new Date(2026, 8, 1) }),
    );
    rerender(<Calendar />);

    expect(
      screen.getByRole("region", { name: "9月1日(火)の予定" }),
    ).toBeInTheDocument();
  });
});
