import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewCalendar } from "./index";
import { useInterviewCalendar } from "./hooks/useInterviewCalendar";

vi.mock("./hooks/useInterviewCalendar", () => ({
  useInterviewCalendar: vi.fn(),
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

const hookResult = (
  overrides: Partial<ReturnType<typeof useInterviewCalendar>>,
) => ({
  month: new Date(2026, 9, 1),
  today: new Date(2026, 9, 6),
  interviews: [],
  isLoading: false,
  error: false,
  goPrevMonth: vi.fn(),
  goNextMonth: vi.fn(),
  goThisMonth: vi.fn(),
  refetch: vi.fn(),
  ...overrides,
});

describe("InterviewCalendar", () => {
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
    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ month: null, today: null }),
    );
    render(<InterviewCalendar />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("フックが返す today を今日として選択する", () => {
    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ today: new Date(2026, 9, 15) }),
    );
    render(<InterviewCalendar />);

    expect(
      screen.getByRole("region", { name: "10月15日(木)の面談" }),
    ).toBeInTheDocument();
  });

  it("取得エラー時はエラーメッセージを表示する", () => {
    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ error: true }),
    );
    render(<InterviewCalendar />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "データの取得に失敗しました",
    );
  });

  it("取得エラー時は再試行ボタンで再取得できる", () => {
    const refetch = vi.fn();
    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ error: true, refetch }),
    );
    render(<InterviewCalendar />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("表示月が変わると選択日がその月の初期値にリセットされる", () => {
    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ month: new Date(2026, 7, 1) }),
    );
    const { rerender } = render(<InterviewCalendar />);
    expect(
      screen.getByRole("region", { name: "8月1日(土)の面談" }),
    ).toBeInTheDocument();

    vi.mocked(useInterviewCalendar).mockReturnValue(
      hookResult({ month: new Date(2026, 8, 1) }),
    );
    rerender(<InterviewCalendar />);

    expect(
      screen.getByRole("region", { name: "9月1日(火)の面談" }),
    ).toBeInTheDocument();
  });
});
