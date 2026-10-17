import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { InterviewsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const baseInterview = {
  initiator_role: "student" as const,
  scheduled_at: null,
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  lock_version: 0,
  student_id: 10,
  student_name: "生徒太郎",
};

const mockData: InterviewsData = {
  interview_requests: [
    {
      ...baseInterview,
      id: 1,
      status: "requested",
      reason_category: "career",
      reason_detail: "志望校について相談したい",
      created_at: "2026-10-01T10:00:00+09:00",
      teacher_id: 20,
      teacher_name: "担任先生",
    },
    {
      ...baseInterview,
      id: 2,
      status: "confirmed",
      initiator_role: "teacher",
      reason_category: null,
      reason_detail: "最近の様子を聞きたい",
      scheduled_at: "2026-10-20T15:30:00+09:00",
      created_at: "2026-10-02T10:00:00+09:00",
      teacher_id: 21,
      teacher_name: "数学先生",
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 20 },
};

const defaultProps = {
  data: mockData,
  page: 1,
  onPageChange: vi.fn(),
  status: "all" as const,
  onStatusChange: vi.fn(),
};

describe("InterviewsPresenter", () => {
  it("見出し「面談」と申請画面へのリンクが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "面談", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "面談を申請" })).toHaveAttribute(
      "href",
      "/interviews/new",
    );
  });

  it("「すべて」と各ステータスの絞り込みが表示され、現在の絞り込みが選択状態になる", () => {
    render(<Presenter {...defaultProps} status="confirmed" />);
    ["すべて", "申請中", "日程調整中", "確定", "完了", "キャンセル"].forEach(
      (label) =>
        expect(screen.getByRole("button", { name: label })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "確定" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("絞り込みをクリックすると onStatusChange が呼ばれる", () => {
    const onStatusChange = vi.fn();
    render(<Presenter {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onStatusChange).toHaveBeenCalledWith("cancelled");
  });

  it("面談ごとに教員名・相談カテゴリ・ステータスを表示し、詳細へのリンクになる", () => {
    render(<Presenter {...defaultProps} />);
    const row = screen.getByRole("link", { name: /担任先生/ });
    expect(row).toHaveAttribute("href", "/interviews/1");
    expect(within(row).getByText("進路")).toBeInTheDocument();
    expect(within(row).getByText("申請中")).toBeInTheDocument();
  });

  it("教員からの面談はカテゴリの代わりに「先生から」と表示し、予定日時があれば表示する", () => {
    render(<Presenter {...defaultProps} />);
    const row = screen.getByRole("link", { name: /数学先生/ });
    expect(within(row).getByText("先生から")).toBeInTheDocument();
    expect(within(row).getByText(/2026\/10\/20 15:30/)).toBeInTheDocument();
  });

  it("面談が0件のときは空表示になる", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{ ...mockData, interview_requests: [] }}
      />,
    );
    expect(screen.getByText("面談はありません")).toBeInTheDocument();
  });

  it("total_pages が2以上のときページネーションが表示され、クリックで onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        onPageChange={onPageChange}
        data={{ ...mockData, meta: { ...mockData.meta, total_pages: 2 } }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("total_pages が1のときページネーションは表示されない", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.queryByRole("button", { name: "Go to page 2" }),
    ).not.toBeInTheDocument();
  });
});
