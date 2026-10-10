import { fireEvent, render, screen } from "@testing-library/react";
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
  today: new Date(2026, 9, 6),
  events: [],
  isLoading: false,
  error: false,
  goPrevMonth: vi.fn(),
  goNextMonth: vi.fn(),
  goThisMonth: vi.fn(),
  refetch: vi.fn(),
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

  it("今日と表示月が決まるまでは読み込み中を表示する", () => {
    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ month: null, today: null }),
    );
    render(<Calendar />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("フックが返す today を今日として選択する", () => {
    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ today: new Date(2026, 9, 15) }),
    );
    render(<Calendar />);

    expect(
      screen.getByRole("region", { name: "10月15日(木)の予定" }),
    ).toBeInTheDocument();
  });

  it("取得エラー時はエラーメッセージを表示する", () => {
    vi.mocked(useCalendar).mockReturnValue(hookResult({ error: true }));
    render(<Calendar />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "データの取得に失敗しました",
    );
  });

  it("取得エラー時は再試行ボタンで再取得できる", () => {
    const refetch = vi.fn();
    vi.mocked(useCalendar).mockReturnValue(
      hookResult({ error: true, refetch }),
    );
    render(<Calendar />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(refetch).toHaveBeenCalledTimes(1);
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
