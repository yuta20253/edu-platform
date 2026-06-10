import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminCourseDetail } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockCourse: AdminCourseDetail = {
  id: 7,
  subject: { id: 1, name: "数学" },
  level_number: 2,
  level_name: "標準",
  description: "標準レベルのコースです",
  units: [
    { id: 11, unit_name: "二次関数", questions_count: 5 },
    { id: 12, unit_name: "三角比", questions_count: 0 },
  ],
};

describe("AdminCourseDetailPresenter", () => {
  it("科目名・レベル・説明が表示される", () => {
    render(<Presenter course={mockCourse} />);
    expect(screen.getByText("数学")).toBeInTheDocument();
    expect(screen.getAllByText("標準レベル2").length).toBeGreaterThan(0);
    expect(screen.getByText("標準レベルのコースです")).toBeInTheDocument();
  });

  it("説明が空の場合はプレースホルダーが表示される", () => {
    render(<Presenter course={{ ...mockCourse, description: null }} />);
    expect(screen.getByText("説明はありません")).toBeInTheDocument();
  });

  it("単元名と問題数が行として表示される", () => {
    render(<Presenter course={mockCourse} />);
    expect(screen.getByText("二次関数")).toBeInTheDocument();
    expect(screen.getByText("三角比")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("問題数0の単元に「CSVで問題を追加」ヒントが表示される", () => {
    render(<Presenter course={mockCourse} />);
    const row = screen.getByText("三角比").closest("tr");
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText(/CSVで問題を追加/),
    ).toBeInTheDocument();
  });

  it("問題数がある単元にはヒントが表示されない", () => {
    render(<Presenter course={mockCourse} />);
    const row = screen.getByText("二次関数").closest("tr");
    expect(
      within(row as HTMLElement).queryByText(/CSVで問題を追加/),
    ).not.toBeInTheDocument();
  });

  it("各単元行のCSVボタンが正しい href を持つ", () => {
    render(<Presenter course={mockCourse} />);
    const row = screen.getByText("二次関数").closest("tr");
    const link = within(row as HTMLElement).getByRole("link", {
      name: /CSV/,
    });
    expect(link).toHaveAttribute("href", "/admin/courses/7/units/11/import");
  });

  it("単元が0件のとき空状態メッセージが表示される", () => {
    render(<Presenter course={{ ...mockCourse, units: [] }} />);
    expect(screen.getByText("単元がまだありません")).toBeInTheDocument();
  });

  it("パンくずに講座一覧リンクがある", () => {
    render(<Presenter course={mockCourse} />);
    const link = screen.getByRole("link", { name: "講座一覧" });
    expect(link).toHaveAttribute("href", "/admin/courses");
  });
});
