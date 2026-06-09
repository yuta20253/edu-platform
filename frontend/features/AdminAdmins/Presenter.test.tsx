import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminsData } from "./types";

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

const mockData: AdminsData = {
  admins: [
    {
      id: 1,
      name: "田中管理者",
      email: "tanaka@example.com",
      created_at: "2025-06-04T10:30:00.000Z",
    },
    {
      id: 2,
      name: "佐藤管理者",
      email: "sato@example.com",
      created_at: "2025-05-01T00:00:00.000Z",
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 50,
    per_page: 25,
  },
};

const defaultProps = {
  data: mockData,
  page: 1,
  query: "",
  onQueryChange: vi.fn(),
  onPageChange: vi.fn(),
  drawerOpen: false,
  onAddClick: vi.fn(),
  onDrawerClose: vi.fn(),
  onCreate: vi.fn(),
  creating: false,
  createErrors: [],
  snackbar: { open: false, message: "", severity: "success" as const },
  onSnackbarClose: vi.fn(),
};

describe("AdminAdminsPresenter", () => {
  it("テーブルヘッダーに「名前」「メールアドレス」「登録日」「詳細」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("名前");
    expect(headers).toContain("メールアドレス");
    expect(headers).toContain("登録日");
    expect(headers).toContain("詳細");
  });

  it("詳細リンクが /admin/admins/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("link", { name: "田中管理者の詳細" }),
    ).toHaveAttribute("href", "/admin/admins/1");
    expect(
      screen.getByRole("link", { name: "佐藤管理者の詳細" }),
    ).toHaveAttribute("href", "/admin/admins/2");
  });

  it("admins データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("田中管理者")).toBeInTheDocument();
    expect(screen.getByText("tanaka@example.com")).toBeInTheDocument();
    expect(screen.getByText("佐藤管理者")).toBeInTheDocument();
    expect(screen.getByText("sato@example.com")).toBeInTheDocument();
  });

  it("登録日が yyyy/MM/dd 形式で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("2025/06/04")).toBeInTheDocument();
  });

  it("アバターに名前の頭文字が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("田")).toBeInTheDocument();
    expect(screen.getByText("佐")).toBeInTheDocument();
  });

  it("件数が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("50 件")).toBeInTheDocument();
  });

  it("RBAC バナーが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText(/全管理者は同等権限/)).toBeInTheDocument();
  });

  it("「管理者を追加」ボタンクリックで onAddClick が呼ばれる", () => {
    const onAddClick = vi.fn();
    render(<Presenter {...defaultProps} onAddClick={onAddClick} />);
    fireEvent.click(screen.getByRole("button", { name: "管理者を追加" }));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it("検索ボックスに入力すると onQueryChange が呼ばれる", () => {
    const onQueryChange = vi.fn();
    render(<Presenter {...defaultProps} onQueryChange={onQueryChange} />);
    const input = screen.getByPlaceholderText("名前・メールで検索");
    fireEvent.change(input, { target: { value: "田中" } });
    expect(onQueryChange).toHaveBeenCalledWith("田中");
  });

  it("ページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("admins が空のとき「管理者が見つかりません」が表示される", () => {
    render(<Presenter {...defaultProps} data={{ ...mockData, admins: [] }} />);
    expect(screen.getByText("管理者が見つかりません")).toBeInTheDocument();
  });
});
