import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Notice, NoticesData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    "aria-label"?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const publisher = { id: 1, name: "管理者太郎", name_kana: "カンリシャタロウ" };

const draftNotice: Notice = {
  id: 1,
  title: "下書きのお知らせ",
  status: "draft",
  target_type: "all_users",
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  publisher,
};

const scheduledNotice: Notice = {
  id: 2,
  title: "予約配信のお知らせ",
  status: "scheduled",
  target_type: "all_users",
  published_at: null,
  scheduled_at: "2026-02-01T09:00:00.000+09:00",
  created_at: "2026-01-02T00:00:00.000Z",
  publisher,
};

const publishedNotice: Notice = {
  id: 3,
  title: "配信済みのお知らせ",
  status: "published",
  target_type: "all_users",
  published_at: "2026-01-03T09:00:00.000+09:00",
  scheduled_at: null,
  created_at: "2026-01-03T00:00:00.000Z",
  publisher,
};

const mockData: NoticesData = {
  announcements: [draftNotice, scheduledNotice, publishedNotice],
  meta: { current_page: 1, total_pages: 3, total_count: 50, per_page: 20 },
};

const defaultProps = {
  data: mockData,
  page: 1,
  query: "",
  status: "" as const,
  onQueryChange: vi.fn(),
  onStatusChange: vi.fn(),
  onPageChange: vi.fn(),
};

describe("NoticesPresenter", () => {
  it("テーブルヘッダーにタイトル・配信対象・配信日時・作成者・ステータスが表示される", () => {
    render(<Presenter {...defaultProps} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(
      expect.arrayContaining([
        "タイトル",
        "配信対象",
        "配信日時",
        "作成者",
        "ステータス",
      ]),
    );
  });

  it("配信対象列はtarget_typeの値に関わらず常に「全ユーザー」と表示される", () => {
    render(<Presenter {...defaultProps} />);
    const targetCells = screen.getAllByText("全ユーザー");
    expect(targetCells).toHaveLength(3);
  });

  it("ステータスに応じたラベルのChipが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("下書き")).toBeInTheDocument();
    expect(screen.getByText("予約配信")).toBeInTheDocument();
    expect(screen.getByText("配信済み")).toBeInTheDocument();
  });

  it("配信日時列はpublished→published_at、scheduled→scheduled_at、draft→-を表示する", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("2026/02/01 09:00")).toBeInTheDocument();
    expect(screen.getByText("2026/01/03 09:00")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(1);
  });

  it("draft/scheduledの行には編集リンクが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("link", { name: "下書きのお知らせを編集" }),
    ).toHaveAttribute("href", "/admin/notices/1/edit");
    expect(
      screen.getByRole("link", { name: "予約配信のお知らせを編集" }),
    ).toHaveAttribute("href", "/admin/notices/2/edit");
  });

  it("publishedの行には編集リンクが表示されない", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.queryByRole("link", { name: "配信済みのお知らせを編集" }),
    ).not.toBeInTheDocument();
  });

  it("「新規作成」ボタンが/admin/notices/newへのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "新規作成" })).toHaveAttribute(
      "href",
      "/admin/notices/new",
    );
  });

  it("検索欄に入力するとonQueryChangeが呼ばれる", () => {
    const onQueryChange = vi.fn();
    render(<Presenter {...defaultProps} onQueryChange={onQueryChange} />);
    fireEvent.change(screen.getByPlaceholderText("タイトルで検索"), {
      target: { value: "メンテナンス" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("メンテナンス");
  });

  it("件数が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("50 件")).toBeInTheDocument();
  });

  it("お知らせが0件のとき「お知らせが見つかりません」と表示される", () => {
    render(
      <Presenter {...defaultProps} data={{ ...mockData, announcements: [] }} />,
    );
    expect(screen.getByText("お知らせが見つかりません")).toBeInTheDocument();
  });

  it("total_pagesが1以下のときページネーションを表示しない", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{
          ...mockData,
          meta: { ...mockData.meta, total_pages: 1 },
        }}
      />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("total_pagesが2以上のときページネーションを表示する", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
