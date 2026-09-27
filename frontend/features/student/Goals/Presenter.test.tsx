import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { GoalsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockData: GoalsData = {
  goals: [
    {
      id: 1,
      title: "英単語1000語を覚える",
      status: "in_progress",
      due_date: "2026-09-30",
      tasks: [
        {
          goal_id: 1,
          title: "task1",
          content: "",
          status: "completed",
          priority: 1,
          due_date: null,
          unit_ids: null,
        },
        {
          goal_id: 1,
          title: "task2",
          content: "",
          status: "not_started",
          priority: 1,
          due_date: null,
          unit_ids: null,
        },
      ],
    },
    {
      id: 2,
      title: "数学の基礎を固める",
      status: "completed",
      due_date: "2026-10-15",
      tasks: [],
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 30,
    per_page: 10,
  },
};

const defaultProps = {
  data: mockData,
  page: 1,
  onPageChange: vi.fn(),
  onDeleteClick: vi.fn(),
  deleteTarget: null,
  deleting: false,
  deleteError: null,
  onDeleteDialogClose: vi.fn(),
  onDeleteConfirm: vi.fn(),
};

describe("GoalsPresenter", () => {
  it("見出し「目標一覧」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("目標一覧")).toBeInTheDocument();
  });

  it("goals データがカードとして正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("英単語1000語を覚える")).toBeInTheDocument();
    expect(screen.getByText("期限 2026-09-30")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    expect(screen.getByText("数学の基礎を固める")).toBeInTheDocument();
    expect(screen.getByText("期限 2026-10-15")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("goals が空のとき「目標が見つかりません」が表示される", () => {
    render(<Presenter {...defaultProps} data={{ ...mockData, goals: [] }} />);
    expect(screen.getByText("目標が見つかりません")).toBeInTheDocument();
  });

  it("目標タイトルのリンクが /goals/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("英単語1000語を覚える").closest("a")).toHaveAttribute(
      "href",
      "/goals/1",
    );
    expect(screen.getByText("数学の基礎を固める").closest("a")).toHaveAttribute(
      "href",
      "/goals/2",
    );
  });

  it("編集アイコンのリンクが /goals/[id]/edit を指している", () => {
    render(<Presenter {...defaultProps} />);
    const editLinks = screen.getAllByRole("link", { name: "編集" });
    expect(editLinks[0]).toHaveAttribute("href", "/goals/1/edit");
  });

  it("目標を追加リンクが /goals/new を指している", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "目標を追加" })).toHaveAttribute(
      "href",
      "/goals/new",
    );
  });

  it("削除アイコンをクリックするとonDeleteClickが呼ばれる", () => {
    const onDeleteClick = vi.fn();
    render(<Presenter {...defaultProps} onDeleteClick={onDeleteClick} />);
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteClick).toHaveBeenCalledWith(1, "英単語1000語を覚える");
  });

  it("deleteTargetがあるとき削除確認ダイアログが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        deleteTarget={{ id: 1, title: "英単語1000語を覚える" }}
      />,
    );
    expect(screen.getByText("目標を削除しますか？")).toBeInTheDocument();
    expect(
      screen.getByText("「英単語1000語を覚える」を削除すると元に戻せません。"),
    ).toBeInTheDocument();
  });

  it("削除確認ダイアログで削除するを押すとonDeleteConfirmが呼ばれる", () => {
    const onDeleteConfirm = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        deleteTarget={{ id: 1, title: "目標" }}
        onDeleteConfirm={onDeleteConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(onDeleteConfirm).toHaveBeenCalled();
  });

  it("deleteErrorがあるとき削除確認ダイアログ内にエラーメッセージが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        deleteTarget={{ id: 1, title: "目標" }}
        deleteError="進行中または完了のタスクがあるため削除できません"
      />,
    );
    expect(
      screen.getByText("進行中または完了のタスクがあるため削除できません"),
    ).toBeInTheDocument();
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
