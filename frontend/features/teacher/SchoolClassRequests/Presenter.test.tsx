import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SchoolClassRequest } from "@/types/schoolClassRequest/schoolClassRequest";
import { Presenter } from "./Presenter";
import type { SchoolClassRequestsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const buildRequest = (
  overrides: Partial<SchoolClassRequest> = {},
): SchoolClassRequest => ({
  id: 1,
  action: "modification",
  status: "pending",
  name: "1年E組",
  reason: null,
  lock_version: 0,
  approved_at: null,
  cancelled_at: null,
  created_at: "2026-10-20T09:00:00+09:00",
  school_class: { id: 3, name: "1年A組" },
  applicant: { id: 10, name: "佐藤先生" },
  approver: null,
  grade: { id: 1, year: 1, display_name: "1年" },
  can_process: false,
  can_cancel: true,
  ...overrides,
});

const buildData = (
  requests: SchoolClassRequest[],
  meta: Partial<SchoolClassRequestsData["meta"]> = {},
): SchoolClassRequestsData => ({
  school_class_requests: requests,
  meta: {
    current_page: 1,
    total_pages: 1,
    total_count: requests.length,
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

const cellsOf = (rowIndex: number) =>
  within(screen.getAllByRole("row")[rowIndex])
    .getAllByRole("cell")
    .map((c) => c.textContent);

describe("teacher/SchoolClassRequests Presenter", () => {
  it("見出しと件数を表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([buildRequest()], { total_count: 25 })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "学級申請" }),
    ).toBeInTheDocument();
    expect(screen.getByText("25件")).toBeInTheDocument();
  });

  it("申請フォームへのリンクを表示する", () => {
    render(<Presenter {...defaultProps} data={buildData([])} />);

    expect(screen.getByRole("link", { name: "申請する" })).toHaveAttribute(
      "href",
      "/teacher/school-class-requests/new",
    );
  });

  it("テーブルの列見出しを表示する", () => {
    render(<Presenter {...defaultProps} data={buildData([buildRequest()])} />);

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "申請日時",
      "種別",
      "学年",
      "対象クラス",
      "新しいクラス名",
      "申請者",
      "ステータス",
      "詳細",
    ]);
  });

  it("改名の申請は申請日時・種別・学年・対象クラス・新しいクラス名・申請者・ステータス・詳細リンクを表示する", () => {
    render(<Presenter {...defaultProps} data={buildData([buildRequest()])} />);

    expect(cellsOf(1)).toEqual([
      "2026/10/20 09:00",
      "改名",
      "1年",
      "1年A組",
      "1年E組",
      "佐藤先生",
      "承認待ち",
      "詳細",
    ]);
    expect(
      within(screen.getAllByRole("row")[1]).getByRole("link", {
        name: "詳細",
      }),
    ).toHaveAttribute("href", "/teacher/school-class-requests/1");
  });

  it("新設の申請は対象クラスを「-」で表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([
          buildRequest({
            action: "creation",
            school_class: null,
            name: "1年F組",
          }),
        ])}
      />,
    );

    const cells = cellsOf(1);
    expect(cells[1]).toBe("新設");
    expect(cells[3]).toBe("-");
    expect(cells[4]).toBe("1年F組");
  });

  it("削除の申請は新しいクラス名を「-」で表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([buildRequest({ action: "deletion", name: null })])}
      />,
    );

    const cells = cellsOf(1);
    expect(cells[1]).toBe("削除");
    expect(cells[3]).toBe("1年A組");
    expect(cells[4]).toBe("-");
  });

  it("承認後に削除されたクラスは対象クラスを「-」で表示する", () => {
    render(
      <Presenter
        {...defaultProps}
        data={buildData([
          buildRequest({
            action: "deletion",
            name: null,
            status: "approved",
            school_class: null,
          }),
        ])}
      />,
    );

    const cells = cellsOf(1);
    expect(cells[3]).toBe("-");
    expect(cells[6]).toBe("承認");
  });

  it("申請が0件のときは空の表示を出す", () => {
    render(<Presenter {...defaultProps} data={buildData([])} />);

    expect(screen.getByText("学級申請はありません")).toBeInTheDocument();
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
    fireEvent.click(within(group).getByRole("button", { name: "却下" }));

    expect(onStatusChange).toHaveBeenCalledWith("rejected");
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
        data={buildData([buildRequest()], { total_pages: 3 })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("1ページのみのときはページネーションを表示しない", () => {
    render(<Presenter {...defaultProps} data={buildData([buildRequest()])} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
