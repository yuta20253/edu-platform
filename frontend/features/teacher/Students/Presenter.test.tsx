import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { StudentsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: StudentsData = {
  students: [
    {
      id: 1,
      name: "山田太郎",
      name_kana: "ヤマダタロウ",
      grade: { display_name: "高校1年" },
    },
    {
      id: 2,
      name: "佐藤花子",
      name_kana: "サトウハナコ",
      grade: { display_name: "高校2年" },
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

describe("StudentsPresenter", () => {
  it("見出しと件数が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("生徒一覧")).toBeInTheDocument();
    expect(screen.getByText("50件")).toBeInTheDocument();
  });

  it("テーブルヘッダーに「氏名」「氏名カナ」「学年」「詳細」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("氏名");
    expect(headers).toContain("氏名カナ");
    expect(headers).toContain("学年");
    expect(headers).toContain("詳細");
  });

  it("students データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("高校1年")).toBeInTheDocument();
    expect(screen.getByText("佐藤花子")).toBeInTheDocument();
    expect(screen.getByText("サトウハナコ")).toBeInTheDocument();
    expect(screen.getByText("高校2年")).toBeInTheDocument();
  });

  it("「詳細」リンクが /teacher/students/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    const detailLinks = screen.getAllByRole("link", { name: "詳細" });
    expect(detailLinks[0]).toHaveAttribute("href", "/teacher/students/1");
    expect(detailLinks[1]).toHaveAttribute("href", "/teacher/students/2");
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

  it("ページネーションのクリックで onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("students が空でもエラーにならずテーブルが表示される", () => {
    render(
      <Presenter {...defaultProps} data={{ ...mockData, students: [] }} />,
    );
    expect(screen.getByText("氏名")).toBeInTheDocument();
    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});
