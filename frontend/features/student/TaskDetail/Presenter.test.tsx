import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Task } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockTask: Task = {
  id: 1,
  goal_id: 10,
  title: "英単語100個を覚える",
  content: "単語帳1〜100を暗記する",
  due_date: "2026-09-01",
  priority: "high",
  status: "in_progress",
  completed_at: "",
  units: [
    {
      id: 20,
      course_id: 5,
      unit_name: "be動詞",
      course: { id: 5, level_number: 1, level_name: "標準" },
    },
  ],
};

describe("TaskDetailPresenter", () => {
  it("タスクのタイトル・期限・ステータス・内容が表示される", () => {
    render(<Presenter task={mockTask} />);
    expect(screen.getByText("英単語100個を覚える")).toBeInTheDocument();
    expect(screen.getByText("期限：2026-09-01")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("単語帳1〜100を暗記する")).toBeInTheDocument();
  });

  it("content が空のとき「内容はまだ入力されていません。」が表示される", () => {
    render(<Presenter task={{ ...mockTask, content: "" }} />);
    expect(
      screen.getByText("内容はまだ入力されていません。"),
    ).toBeInTheDocument();
  });

  it("units が正しくレンダリングされ、学習リンクが goalId なしの正しい href を持つ", () => {
    render(<Presenter task={mockTask} />);
    expect(screen.getByText("標準レベル1 - be動詞")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "学習" })).toHaveAttribute(
      "href",
      "/tasks/1/units/20",
    );
  });

  it("units が空のとき「紐づく単元はありません」が表示される", () => {
    render(<Presenter task={{ ...mockTask, units: [] }} />);
    expect(screen.getByText("紐づく単元はありません")).toBeInTheDocument();
  });

  it("goalId がないとき「タスク一覧に戻る」リンクと編集リンクが /tasks/[id]/edit を指す", () => {
    render(<Presenter task={mockTask} />);
    expect(
      screen.getByRole("link", { name: /タスク一覧に戻る/ }),
    ).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: "編集する" })).toHaveAttribute(
      "href",
      "/tasks/1/edit",
    );
  });

  it("goalId があるとき「目標詳細に戻る」リンクと編集リンク・学習リンクが goal 配下の href を持つ", () => {
    render(<Presenter task={mockTask} goalId={99} />);
    expect(
      screen.getByRole("link", { name: /目標詳細に戻る/ }),
    ).toHaveAttribute("href", "/goals/99");
    expect(screen.getByRole("link", { name: "編集する" })).toHaveAttribute(
      "href",
      "/goals/99/tasks/1/edit",
    );
    expect(screen.getByRole("link", { name: "学習" })).toHaveAttribute(
      "href",
      "/goals/99/tasks/1/units/20",
    );
  });
});
