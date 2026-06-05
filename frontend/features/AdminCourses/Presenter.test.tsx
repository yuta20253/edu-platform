import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminCoursesData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: AdminCoursesData = {
  courses: [
    {
      id: 1,
      level_name: "基礎",
      level_number: 1,
      subject: { id: 1, name: "英語" },
      units_count: 5,
      questions_count: 42,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 2,
      level_name: "標準",
      level_number: 2,
      subject: { id: 2, name: "数学" },
      units_count: 8,
      questions_count: 100,
      created_at: "2026-02-01T00:00:00Z",
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
  q: "",
  perPage: 20,
  sort: "created_at" as const,
  order: "desc" as const,
  page: 1,
  onSearchChange: vi.fn(),
  onPerPageChange: vi.fn(),
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
};

describe("AdminCoursesPresenter", () => {
  it("テーブルヘッダーに「講座名」「科目」「単元数」「問題数」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("講座名");
    expect(headers).toContain("科目");
    expect(headers).toContain("単元数");
    expect(headers).toContain("問題数");
  });

  it("courses データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("基礎")).toBeInTheDocument();
    expect(screen.getByText("英語")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("標準")).toBeInTheDocument();
    expect(screen.getByText("数学")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("講座名ヘッダーをクリックすると onSortChange が呼ばれる", () => {
    const onSortChange = vi.fn();
    render(<Presenter {...defaultProps} onSortChange={onSortChange} />);
    const sortButton = screen.getByRole("button", { name: /講座名/ });
    fireEvent.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith("level_name");
  });

  it("検索ワード入力で onSearchChange が呼ばれる", () => {
    const onSearchChange = vi.fn();
    render(<Presenter {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText("講座名で検索");
    fireEvent.change(input, { target: { value: "英語" } });
    expect(onSearchChange).toHaveBeenCalledWith("英語");
  });

  it("検索ワードが入力欄に反映される", () => {
    render(<Presenter {...defaultProps} q="基礎" />);
    const input = screen.getByPlaceholderText<HTMLInputElement>("講座名で検索");
    expect(input.value).toBe("基礎");
  });

  it("表示件数プルダウンに 20 / 50 / 100 が表示され、変更で onPerPageChange が呼ばれる", () => {
    const onPerPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPerPageChange={onPerPageChange} />);
    const select = screen.getByRole("combobox");
    fireEvent.mouseDown(select);
    expect(screen.getByRole("option", { name: "20件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100件" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "50件" }));
    expect(onPerPageChange).toHaveBeenCalledWith(50);
  });

  it("ページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("行が /admin/courses/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    const rowLinks = screen.getAllByRole("link");
    const hrefs = rowLinks.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/admin/courses/1");
    expect(hrefs).toContain("/admin/courses/2");
  });

  it("courses が空のとき「講座が見つかりません」が表示される", () => {
    render(
      <Presenter {...defaultProps} data={{ ...mockData, courses: [] }} />,
    );
    expect(screen.getByText("講座が見つかりません")).toBeInTheDocument();
  });
});
