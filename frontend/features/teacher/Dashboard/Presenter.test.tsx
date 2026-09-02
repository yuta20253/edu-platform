import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { DashboardData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: DashboardData = {
  stats: {
    grade_one_students_count: 10,
    grade_two_students_count: 8,
    grade_three_students_count: 5,
  },
  announcements: [
    {
      id: 1,
      title: "夏期講習のお知らせ",
      content: "夏期講習を開催します",
      published_at: "2025-06-04T10:30:00.000Z",
    },
    {
      id: 2,
      title: "定期テスト対策について",
      content: "定期テスト対策を行います",
      published_at: "2025-06-10T00:00:00.000Z",
    },
  ],
};

describe("TeacherDashboardPresenter", () => {
  it("学年別の生徒数KPIカードが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("高１生")).toBeInTheDocument();
    expect(screen.getByText("10人")).toBeInTheDocument();
    expect(screen.getByText("高２生")).toBeInTheDocument();
    expect(screen.getByText("8人")).toBeInTheDocument();
    expect(screen.getByText("高３生")).toBeInTheDocument();
    expect(screen.getByText("5人")).toBeInTheDocument();
  });

  it("お知らせテーブルのヘッダーに「公開日」「タイトル」「ステータス」が表示される", () => {
    render(<Presenter data={mockData} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("公開日");
    expect(headers).toContain("タイトル");
    expect(headers).toContain("ステータス");
  });

  it("announcements が行として正しくレンダリングされる", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("夏期講習のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("2025/06/04")).toBeInTheDocument();
    expect(screen.getByText("定期テスト対策について")).toBeInTheDocument();
    expect(screen.getByText("2025/06/10")).toBeInTheDocument();
  });

  it("published_at がある場合「公開中」チップが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getAllByText("公開中")).toHaveLength(2);
  });

  it("announcements が空のとき「お知らせはありません」が表示される", () => {
    render(<Presenter data={{ ...mockData, announcements: [] }} />);
    expect(screen.getByText("お知らせはありません")).toBeInTheDocument();
  });

  it("クイックアクションのリンクが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(
      screen.getByRole("link", { name: "教員を追加する" }),
    ).toHaveAttribute("href", "/teacher/announcements/new");
    expect(
      screen.getByRole("link", { name: "お知らせを作成する" }),
    ).toHaveAttribute("href", "/teacher/announcements/new");
  });
});
