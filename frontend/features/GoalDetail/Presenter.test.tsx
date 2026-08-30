import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Goal } from "./types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockGoal: Goal = {
  id: 1,
  title: "英単語1000語を覚える",
  description: "毎日30分学習する",
  status: "in_progress",
  due_date: "2026-09-30",
  tasks: [
    {
      id: 10,
      title: "単語帳を1周する",
      due_date: "2026-09-10",
      status: "completed",
      completed_at: "2026-09-05T00:00:00.000Z",
    },
    {
      id: 11,
      title: "確認テストを受ける",
      due_date: "2026-09-20",
      status: "not_started",
      completed_at: "",
    },
  ],
};

describe("GoalDetailPresenter", () => {
  it("見出し・タイトル・期限・ステータス・説明が表示される", () => {
    render(<Presenter goal={mockGoal} />);
    expect(screen.getByText("目標詳細")).toBeInTheDocument();
    expect(screen.getByText("英単語1000語を覚える")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-09-30")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("毎日30分学習する")).toBeInTheDocument();
  });

  it("説明が空のとき「説明はありません」と表示される", () => {
    render(<Presenter goal={{ ...mockGoal, description: "" }} />);
    expect(screen.getByText("説明はありません")).toBeInTheDocument();
  });

  it("タスクが行として正しくレンダリングされる", () => {
    render(<Presenter goal={mockGoal} />);
    expect(screen.getByText("単語帳を1周する")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-09-10")).toBeInTheDocument();
    expect(screen.getByText("確認テストを受ける")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-09-20")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("未着手")).toBeInTheDocument();
  });

  it("tasks が空のとき「タスクはまだありません」が表示される", () => {
    render(<Presenter goal={{ ...mockGoal, tasks: [] }} />);
    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("tasks が null のとき「タスクはまだありません」が表示される", () => {
    render(<Presenter goal={{ ...mockGoal, tasks: null }} />);
    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("「目標一覧へ戻る」リンクが /goals を指している", () => {
    render(<Presenter goal={mockGoal} />);
    expect(screen.getByText("目標一覧へ戻る").closest("a")).toHaveAttribute(
      "href",
      "/goals",
    );
  });

  it("「編集」ボタンが /goals/[id]/edit を指している", () => {
    render(<Presenter goal={mockGoal} />);
    expect(screen.getByRole("link", { name: "編集" })).toHaveAttribute(
      "href",
      "/goals/1/edit",
    );
  });

  it("各タスクのリンクが /goals/[id]/tasks/[taskId] を指している", () => {
    render(<Presenter goal={mockGoal} />);
    expect(
      screen.getByText("単語帳を1周する").closest("a"),
    ).toHaveAttribute("href", "/goals/1/tasks/10");
    expect(
      screen.getByText("確認テストを受ける").closest("a"),
    ).toHaveAttribute("href", "/goals/1/tasks/11");
  });
});
