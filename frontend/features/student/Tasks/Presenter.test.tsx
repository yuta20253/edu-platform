import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { TasksData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: TasksData = {
  tasks: [
    {
      id: 1,
      goal_id: 10,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      due_date: "2026-09-01",
      priority: "high",
      status: "not_started",
      completed_at: "",
    },
    {
      id: 2,
      goal_id: 10,
      title: "数学の宿題を終わらせる",
      content: "問題集P.10〜20",
      due_date: "2026-09-05",
      priority: "medium",
      status: "completed",
      completed_at: "2026-08-30",
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

describe("TasksPresenter", () => {
  it("見出し「タスク一覧」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("タスク一覧")).toBeInTheDocument();
  });

  it("tasks データがカードとして正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("英単語100個を覚える")).toBeInTheDocument();
    expect(screen.getByText("期限：2026-09-01")).toBeInTheDocument();
    expect(screen.getByText("未着手")).toBeInTheDocument();
    expect(screen.getByText("数学の宿題を終わらせる")).toBeInTheDocument();
    expect(screen.getByText("期限：2026-09-05")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("各カードのリンクが /tasks/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/tasks/1");
    expect(links[1]).toHaveAttribute("href", "/tasks/2");
  });

  it("tasks が空のとき「タスクが見つかりません」が表示される", () => {
    render(<Presenter {...defaultProps} data={{ ...mockData, tasks: [] }} />);
    expect(screen.getByText("タスクが見つかりません")).toBeInTheDocument();
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

  it("total_pages が2以上のときページネーションが表示され、クリックで onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPageChange={onPageChange} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
