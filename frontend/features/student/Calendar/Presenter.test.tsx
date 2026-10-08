import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { CalendarEvent } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const events: CalendarEvent[] = [
  {
    type: "task",
    id: 20,
    date: "2026/10/06",
    title: "英単語100問",
    status: "in_progress",
  },
  {
    type: "goal",
    id: 10,
    date: "2026/10/06",
    title: "模試で偏差値60",
    status: "not_started",
  },
  {
    type: "interview_request",
    id: 30,
    date: "2026/10/15",
    title: "進路について相談したい",
    status: "confirmed",
  },
];

const defaultProps = {
  month: new Date(2026, 9, 1),
  today: new Date(2026, 9, 6),
  events,
  isLoading: false,
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
  onThisMonth: vi.fn(),
};

const dayList = () => screen.getByRole("region", { name: /の予定$/ });

describe("CalendarPresenter", () => {
  it("表示中の年月と曜日が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("2026年10月")).toBeInTheDocument();
    ["日", "月", "火", "水", "木", "金", "土"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });

  it("前の月・次の月・今月ボタンでそれぞれのハンドラが呼ばれる", () => {
    const onPrevMonth = vi.fn();
    const onNextMonth = vi.fn();
    const onThisMonth = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onThisMonth={onThisMonth}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "前の月" }));
    fireEvent.click(screen.getByRole("button", { name: "次の月" }));
    fireEvent.click(screen.getByRole("button", { name: "今月" }));

    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
    expect(onThisMonth).toHaveBeenCalledTimes(1);
  });

  it("日付セルに予定の件数が読み上げラベルとして付与される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "10月6日 予定2件" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "10月7日 予定なし" }),
    ).toBeInTheDocument();
  });

  it("表示月が今月のときは今日の予定が初期表示される", () => {
    render(<Presenter {...defaultProps} />);
    const list = dayList();
    expect(list).toHaveAccessibleName("10月6日(火)の予定");
    expect(within(list).getByText("英単語100問")).toBeInTheDocument();
    expect(within(list).getByText("模試で偏差値60")).toBeInTheDocument();
  });

  it("表示月が今月でないときは月初の予定が初期表示される", () => {
    render(<Presenter {...defaultProps} month={new Date(2026, 10, 1)} />);
    expect(dayList()).toHaveAccessibleName("11月1日(日)の予定");
  });

  it("各予定が種別ごとの詳細画面へのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    const links = within(dayList()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/tasks/20",
      "/goals/10",
    ]);

    fireEvent.click(screen.getByRole("button", { name: "10月15日 予定1件" }));

    expect(within(dayList()).getByRole("link")).toHaveAttribute(
      "href",
      "/interviews/30",
    );
  });

  it("予定の種別ラベルとステータスが表示される", () => {
    render(<Presenter {...defaultProps} />);
    const list = dayList();
    expect(within(list).getByText("タスク")).toBeInTheDocument();
    expect(within(list).getByText("進行中")).toBeInTheDocument();
    expect(within(list).getByText("目標")).toBeInTheDocument();
    expect(within(list).getByText("未着手")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "10月15日 予定1件" }));

    expect(within(dayList()).getByText("面談")).toBeInTheDocument();
    expect(within(dayList()).getByText("確定")).toBeInTheDocument();
  });

  it("日付セルをクリックすると選択状態になる", () => {
    render(<Presenter {...defaultProps} />);
    const cell = screen.getByRole("button", { name: "10月15日 予定1件" });
    expect(cell).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(cell);

    expect(cell).toHaveAttribute("aria-pressed", "true");
    expect(dayList()).toHaveAccessibleName("10月15日(木)の予定");
  });

  it("予定がない日は「予定はありません」と表示される", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "10月7日 予定なし" }));
    expect(within(dayList()).getByText("予定はありません")).toBeInTheDocument();
  });

  it("前後月の見切れ日もセルとして表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "9月27日 予定なし" }),
    ).toBeInTheDocument();
  });

  describe("スマホ幅のドット表示", () => {
    const eventsOn = (date: string, count: number): CalendarEvent[] =>
      Array.from({ length: count }, (_, i) => ({
        type: "task" as const,
        id: 100 + i,
        date,
        title: `タスク${i + 1}`,
        status: "not_started" as const,
      }));

    const dotsOf = (cellName: string) =>
      within(screen.getByRole("button", { name: cellName })).getByTestId(
        "calendar-dots",
      );

    it("4件以上ある日はドットを3つまで表示し、残りを+Nで示す", () => {
      render(
        <Presenter {...defaultProps} events={eventsOn("2026/10/20", 5)} />,
      );
      const dots = dotsOf("10月20日 予定5件");

      expect(within(dots).getAllByTestId("calendar-dot")).toHaveLength(3);
      expect(within(dots).getByText("+2")).toBeInTheDocument();
    });

    it("3件以下の日は+Nを表示しない", () => {
      render(
        <Presenter {...defaultProps} events={eventsOn("2026/10/20", 3)} />,
      );
      const dots = dotsOf("10月20日 予定3件");

      expect(within(dots).getAllByTestId("calendar-dot")).toHaveLength(3);
      expect(within(dots).queryByText(/^\+/)).not.toBeInTheDocument();
    });
  });

  it("読み込み中はプログレスバーが表示される", () => {
    render(<Presenter {...defaultProps} isLoading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("読み込み完了後はプログレスバーが表示されない", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
