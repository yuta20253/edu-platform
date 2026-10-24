import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InterviewRequest } from "@/types/interview/interviewRequest";
import { Presenter } from "./Presenter";
import type { InterviewsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const buildInterview = (
  overrides: Partial<InterviewRequest> = {},
): InterviewRequest => ({
  id: 1,
  status: "requested",
  initiator_role: "student",
  reason_category: "career",
  reason_detail: "進路の相談",
  scheduled_at: null,
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  lock_version: 0,
  created_at: "2026-10-20T09:00:00+09:00",
  student_id: 10,
  student_name: "山田太郎",
  teacher_id: 20,
  teacher_name: "佐藤先生",
  ...overrides,
});

const buildData = (
  interviews: InterviewRequest[],
  meta: Partial<InterviewsData["meta"]> = {},
): InterviewsData => ({
  interview_requests: interviews,
  meta: {
    current_page: 1,
    total_pages: 1,
    total_count: interviews.length,
    per_page: 20,
    ...meta,
  },
});

const defaultProps = {
  page: 1,
  onPageChange: vi.fn(),
  status: "all" as const,
  onStatusChange: vi.fn(),
};

describe("teacher/Interviews Presenter", () => {
  it("見出しと件数を表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([buildInterview()], { total_count: 25 })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "面談一覧" }),
    ).toBeInTheDocument();
    expect(screen.getByText("25件")).toBeInTheDocument();
  });

  it("面談の申請画面へのリンクを表示する", () => {
    render(<Presenter {...defaultProps} data={buildData([])} />);

    expect(screen.getByRole("link", { name: "面談を申請" })).toHaveAttribute(
      "href",
      "/teacher/interviews/new",
    );
  });

  it("テーブルの列見出しを表示する", () => {
    render(
      <Presenter {...defaultProps} data={buildData([buildInterview()])} />,
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "生徒",
      "申請元",
      "相談カテゴリ",
      "予定日時",
      "ステータス",
      "詳細",
    ]);
  });

  it("生徒からの申請は生徒名・申請元・相談カテゴリ・ステータス・詳細リンクを表示する", () => {
    render(
      <Presenter {...defaultProps} data={buildData([buildInterview()])} />,
    );

    const row = screen.getAllByRole("row")[1];
    expect(within(row).getByText("山田太郎")).toBeInTheDocument();
    expect(within(row).getByText("生徒")).toBeInTheDocument();
    expect(within(row).getByText("進路")).toBeInTheDocument();
    expect(within(row).getByText("申請中")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "詳細" })).toHaveAttribute(
      "href",
      "/teacher/interviews/1",
    );
  });

  it("教員からの申請は申請元を教員とし、相談カテゴリは「-」を表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([
          buildInterview({ initiator_role: "teacher", reason_category: null }),
        ])}
      />,
    );

    const cells = within(screen.getAllByRole("row")[1])
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(cells[1]).toBe("教員");
    expect(cells[2]).toBe("-");
  });

  it("予定日時があれば日時を、なければ「-」を表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([
          buildInterview({
            id: 1,
            status: "confirmed",
            scheduled_at: "2026-11-01T10:30:00+09:00",
          }),
          buildInterview({ id: 2 }),
        ])}
      />,
    );

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getAllByRole("cell")[3]).toHaveTextContent(
      "2026/11/01 10:30",
    );
    expect(within(rows[2]).getAllByRole("cell")[3]).toHaveTextContent("-");
  });

  it("面談が0件のときは空の表示を出す", () => {
    render(<Presenter {...defaultProps} data={buildData([])} />);

    expect(screen.getByText("面談はありません")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("ステータスの絞り込みを押すと onStatusChange を呼ぶ", () => {
    const onStatusChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        onStatusChange={onStatusChange}
        data={buildData([])}
      />,
    );

    const group = screen.getByRole("group", { name: "ステータスで絞り込み" });
    fireEvent.click(within(group).getByRole("button", { name: "確定" }));

    expect(onStatusChange).toHaveBeenCalledWith("confirmed");
  });

  it("選択中の絞り込みを押し直しても onStatusChange を呼ばない", () => {
    const onStatusChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        onStatusChange={onStatusChange}
        data={buildData([])}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "すべて" }));

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("複数ページあるときはページネーションを表示し、押すと onPageChange を呼ぶ", () => {
    const onPageChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        onPageChange={onPageChange}
        data={buildData([buildInterview()], { total_pages: 3 })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("1ページのみのときはページネーションを表示しない", () => {
    render(
      <Presenter {...defaultProps} data={buildData([buildInterview()])} />,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
