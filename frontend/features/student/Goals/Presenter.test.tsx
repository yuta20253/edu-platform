import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { GoalsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
};

describe("GoalsPresenter", () => {
  it("見出し「目標一覧」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("目標一覧")).toBeInTheDocument();
  });

  it("goals データがカードとして正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("英単語1000語を覚える")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-09-30")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("進捗率:50%")).toBeInTheDocument();

    expect(screen.getByText("数学の基礎を固める")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-10-15")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("進捗率:0%")).toBeInTheDocument();
  });

  it("goals が空のとき「目標が見つかりません」が表示される", () => {
    render(<Presenter {...defaultProps} data={{ ...mockData, goals: [] }} />);
    expect(screen.getByText("目標が見つかりません")).toBeInTheDocument();
  });

  it("各カードのリンクが /goals/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/goals/1");
    expect(links[1]).toHaveAttribute("href", "/goals/2");
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
