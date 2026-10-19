import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { ScheduledInterview } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const interview = (
  overrides: Partial<ScheduledInterview> & { scheduledAt: Date },
): ScheduledInterview => {
  const { scheduledAt, ...rest } = overrides;
  return {
    id: 1,
    status: "confirmed",
    initiator_role: "student",
    reason_category: "career",
    reason_detail: "進路について相談したい",
    scheduled_at: scheduledAt.toISOString(),
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    lock_version: 0,
    created_at: new Date(2026, 9, 1).toISOString(),
    student_id: 2,
    student_name: "山田太郎",
    teacher_id: 3,
    teacher_name: "佐藤先生",
    ...rest,
  };
};

const interviews: ScheduledInterview[] = [
  interview({
    id: 10,
    scheduledAt: new Date(2026, 9, 6, 10, 0),
    student_name: "山田太郎",
    reason_category: "career",
    status: "confirmed",
  }),
  interview({
    id: 11,
    scheduledAt: new Date(2026, 9, 6, 15, 30),
    student_name: "鈴木花子",
    reason_category: "study_method",
    status: "scheduling",
  }),
  interview({
    id: 12,
    scheduledAt: new Date(2026, 9, 15, 9, 0),
    student_name: "田中一郎",
    reason_category: null,
    status: "requested",
  }),
];

const defaultProps = {
  month: new Date(2026, 9, 1),
  today: new Date(2026, 9, 6),
  interviews,
  isLoading: false,
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
  onThisMonth: vi.fn(),
};

const dayList = () => screen.getByRole("region", { name: /の面談$/ });

describe("InterviewCalendarPresenter", () => {
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

  it("日付セルに面談の件数が読み上げラベルとして付与される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "10月6日 面談2件" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "10月7日 面談なし" }),
    ).toBeInTheDocument();
  });

  it("日付セルに面談の時刻と生徒名が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const cell = screen.getByRole("button", { name: "10月6日 面談2件" });
    expect(within(cell).getByText("10:00 山田太郎")).toBeInTheDocument();
    expect(within(cell).getByText("15:30 鈴木花子")).toBeInTheDocument();
  });

  it("4件以上ある日はセルに3件まで表示し、残りを+Nで示す", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      interview({
        id: 100 + i,
        scheduledAt: new Date(2026, 9, 20, 9 + i, 0),
        student_name: `生徒${i + 1}`,
      }),
    );
    render(<Presenter {...defaultProps} interviews={many} />);
    const cell = screen.getByRole("button", { name: "10月20日 面談5件" });

    expect(within(cell).getByText("11:00 生徒3")).toBeInTheDocument();
    expect(within(cell).queryByText("12:00 生徒4")).not.toBeInTheDocument();
    expect(within(cell).getByText("+2")).toBeInTheDocument();
  });

  it("表示月が今月のときは今日の面談が初期表示される", () => {
    render(<Presenter {...defaultProps} />);
    const list = dayList();
    expect(list).toHaveAccessibleName("10月6日(火)の面談");
    expect(within(list).getByText("山田太郎")).toBeInTheDocument();
    expect(within(list).getByText("鈴木花子")).toBeInTheDocument();
  });

  it("表示月が今月でないときは月初の面談が初期表示される", () => {
    render(<Presenter {...defaultProps} month={new Date(2026, 10, 1)} />);
    expect(dayList()).toHaveAccessibleName("11月1日(日)の面談");
  });

  it("面談一覧に時刻・相談カテゴリ・ステータスが表示される", () => {
    render(<Presenter {...defaultProps} />);
    const list = dayList();
    expect(within(list).getByText("10:00")).toBeInTheDocument();
    expect(within(list).getByText("進路")).toBeInTheDocument();
    expect(within(list).getByText("確定")).toBeInTheDocument();
    expect(within(list).getByText("15:30")).toBeInTheDocument();
    expect(within(list).getByText("勉強方法")).toBeInTheDocument();
    expect(within(list).getByText("日程調整中")).toBeInTheDocument();
  });

  it("相談カテゴリが未設定の面談はカテゴリを表示しない", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "10月15日 面談1件" }));

    const list = dayList();
    expect(within(list).getByText("田中一郎")).toBeInTheDocument();
    expect(within(list).getByText("申請中")).toBeInTheDocument();
    expect(within(list).queryByText("その他")).not.toBeInTheDocument();
  });

  it("各面談が教員の面談詳細画面へのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    const links = within(dayList()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/teacher/interviews/10",
      "/teacher/interviews/11",
    ]);
  });

  it("日付セルをクリックすると選択状態になり、その日の面談が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const cell = screen.getByRole("button", { name: "10月15日 面談1件" });
    expect(cell).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(cell);

    expect(cell).toHaveAttribute("aria-pressed", "true");
    expect(dayList()).toHaveAccessibleName("10月15日(木)の面談");
    expect(within(dayList()).getByRole("link")).toHaveAttribute(
      "href",
      "/teacher/interviews/12",
    );
  });

  it("面談がない日は「面談の予定はありません」と表示される", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "10月7日 面談なし" }));
    expect(
      within(dayList()).getByText("面談の予定はありません"),
    ).toBeInTheDocument();
  });

  it("前後月の見切れ日もセルとして表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "9月27日 面談なし" }),
    ).toBeInTheDocument();
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
