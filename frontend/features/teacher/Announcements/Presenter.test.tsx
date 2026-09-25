import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnnouncementsResult } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const receivedData: AnnouncementsResult = {
  tab: "received",
  data: {
    announcements: [
      {
        id: 1,
        title: "受信お知らせ",
        content: "内容1",
        publisher: { id: 1, name: "山田先生", name_kana: "ヤマダ" },
        published_at: "2025-06-01T00:00:00.000Z",
      },
    ],
    meta: { current_page: 1, total_pages: 3, total_count: 30, per_page: 10 },
  },
};

const authoredData: AnnouncementsResult = {
  tab: "authored",
  data: {
    announcements: [
      {
        id: 2,
        title: "作成した下書き",
        content: "下書きの内容",
        status: "draft",
        published_at: null,
        scheduled_at: null,
      },
      {
        id: 3,
        title: "予約中のお知らせ",
        content: "予約の内容",
        status: "scheduled",
        published_at: null,
        scheduled_at: "2025-07-01T00:00:00.000Z",
      },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 10 },
  },
};

const defaultProps = {
  tab: "received" as const,
  data: receivedData,
  page: 1,
  onTabChange: vi.fn(),
  onPageChange: vi.fn(),
};

describe("AnnouncementsPresenter", () => {
  it("見出しと件数が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("お知らせ一覧")).toBeInTheDocument();
    expect(screen.getByText("30件")).toBeInTheDocument();
  });

  it("受信タブでテーブルにお知らせが表示され、詳細リンクが正しい", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("受信お知らせ")).toBeInTheDocument();
    expect(screen.getByText("山田先生")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "詳細" })).toHaveAttribute(
      "href",
      "/teacher/announcements/1",
    );
  });

  it("作成分タブでは各お知らせのステータスが表示される", () => {
    render(<Presenter {...defaultProps} tab="authored" data={authoredData} />);
    expect(screen.getByText("作成した下書き")).toBeInTheDocument();
    expect(screen.getByText("下書き")).toBeInTheDocument();
    expect(screen.getByText("予約中のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("予約中")).toBeInTheDocument();
  });

  it("タブをクリックするとonTabChangeが呼ばれる", () => {
    const onTabChange = vi.fn();
    render(<Presenter {...defaultProps} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("自分が作成したお知らせ"));
    expect(onTabChange).toHaveBeenCalledWith("authored");
  });

  it("total_pagesが1より大きいときページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("total_pagesが1のときページネーションが表示されない", () => {
    render(<Presenter {...defaultProps} data={authoredData} tab="authored" />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("ページネーションのクリックでonPageChangeが呼ばれる", () => {
    const onPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("announcementsが空でもエラーにならない(受信タブ)", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{
          tab: "received",
          data: { ...receivedData.data, announcements: [] },
        }}
      />,
    );
    expect(screen.getByText("お知らせが見つかりません")).toBeInTheDocument();
  });

  it("announcementsが空でもエラーにならない(作成分タブ)", () => {
    render(
      <Presenter
        {...defaultProps}
        tab="authored"
        data={{
          tab: "authored",
          data: { ...authoredData.data, announcements: [] },
        }}
      />,
    );
    expect(screen.getByText("お知らせが見つかりません")).toBeInTheDocument();
  });

  it("「新規作成」ボタンが無効状態で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("button", { name: "新規作成" })).toBeDisabled();
  });

  it("作成分タブの各お知らせを展開すると無効状態の「更新」ボタンが表示される", () => {
    render(<Presenter {...defaultProps} tab="authored" data={authoredData} />);
    fireEvent.click(screen.getByText("作成した下書き"));
    fireEvent.click(screen.getByText("予約中のお知らせ"));

    const updateButtons = screen.getAllByRole("button", {
      name: "更新",
    });
    expect(updateButtons).toHaveLength(2);
    updateButtons.forEach((button) => expect(button).toBeDisabled());
  });
});
