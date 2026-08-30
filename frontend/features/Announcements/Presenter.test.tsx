import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnnouncementsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: AnnouncementsData = {
  announcements: [
    {
      id: 1,
      title: "夏期講習のお知らせ",
      content: "夏期講習を開催します。",
      publisher: { id: 1, name: "運営事務局", name_kana: "ウンエイジムキョク" },
      published_at: "2025-06-01T10:00:00.000Z",
    },
    {
      id: 2,
      title: "メンテナンスのお知らせ",
      content: "システムメンテナンスを行います。",
      publisher: {
        id: 2,
        name: "システム管理者",
        name_kana: "システムカンリシャ",
      },
      published_at: "2025-06-05T12:00:00.000Z",
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 50,
    per_page: 20,
  },
};

const defaultProps = {
  data: mockData,
  page: 1,
  onPageChange: vi.fn(),
};

describe("AnnouncementsPresenter", () => {
  it("お知らせ一覧のタイトル・発行者が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("夏期講習のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("発行者: 運営事務局")).toBeInTheDocument();
    expect(screen.getByText("メンテナンスのお知らせ")).toBeInTheDocument();
    expect(screen.getByText("発行者: システム管理者")).toBeInTheDocument();
  });

  it("各カードが /announcements/[id] を指すリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/announcements/1");
    expect(links[1]).toHaveAttribute("href", "/announcements/2");
  });

  it("announcements が空のとき「お知らせが見つかりません」が表示される", () => {
    render(
      <Presenter {...defaultProps} data={{ ...mockData, announcements: [] }} />,
    );
    expect(screen.getByText("お知らせが見つかりません")).toBeInTheDocument();
  });

  it("total_pages が1より大きいときページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("total_pages が1のときページネーションが表示されない", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{ ...mockData, meta: { ...mockData.meta, total_pages: 1 } }}
      />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("ページネーションをクリックすると onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
