import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { GoalType } from "@/libs/server/studentDashboard";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockGoals: GoalType[] = [
  {
    id: 1,
    title: "数学の基礎を固める",
    description: "教科書の例題を全て解く",
    status: "in_progress",
    due_date: "2025-07-01",
  },
  {
    id: 2,
    title: "英単語1000語暗記",
    description: "単語帳を1周する",
    status: "completed",
    due_date: "2025-08-01",
  },
];

describe("HomePresenter", () => {
  it("目標一覧のタイトル見出しが表示される", () => {
    render(<Presenter initialGoals={mockGoals} />);
    expect(screen.getByText("目標")).toBeInTheDocument();
    expect(screen.getByText("達成度")).toBeInTheDocument();
    expect(screen.getByText("期限")).toBeInTheDocument();
  });

  it("initialGoals が行として正しくレンダリングされる", () => {
    render(<Presenter initialGoals={mockGoals} />);
    expect(screen.getByText("数学の基礎を固める")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("2025-07-01")).toBeInTheDocument();
    expect(screen.getByText("英単語1000語暗記")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("2025-08-01")).toBeInTheDocument();
  });

  it("initialGoals が空でもエラーにならず一覧が表示される", () => {
    render(<Presenter initialGoals={[]} />);
    expect(screen.getByText("目標")).toBeInTheDocument();
    expect(screen.queryByText("数学の基礎を固める")).not.toBeInTheDocument();
  });

  it("initialGoals が null 相当でもクラッシュしない", () => {
    render(<Presenter initialGoals={null as unknown as GoalType[]} />);
    expect(screen.getByText("目標")).toBeInTheDocument();
  });

  it("「目標一覧」リンクが /goals を指している", () => {
    render(<Presenter initialGoals={mockGoals} />);
    expect(screen.getByRole("link", { name: "目標一覧" })).toHaveAttribute(
      "href",
      "/goals",
    );
  });

  it("「目標追加」リンクが /goals/new を指している", () => {
    render(<Presenter initialGoals={mockGoals} />);
    expect(screen.getByRole("link", { name: "目標追加" })).toHaveAttribute(
      "href",
      "/goals/new",
    );
  });

  it("編集リンクが /goals/[id]/edit を指している", () => {
    render(<Presenter initialGoals={mockGoals} />);
    const editLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.includes("/edit"));
    expect(editLinks[0]).toHaveAttribute("href", "/goals/1/edit");
    expect(editLinks[1]).toHaveAttribute("href", "/goals/2/edit");
  });

  it("定期テスト管理・志望校管理・受験校管理へのリンクが表示される", () => {
    render(<Presenter initialGoals={mockGoals} />);
    expect(
      screen.getByRole("link", { name: "定期テスト管理" }),
    ).toHaveAttribute("href", "/exams");
    expect(screen.getByRole("link", { name: "志望校管理" })).toHaveAttribute(
      "href",
      "/desired-schools",
    );
    expect(screen.getByRole("link", { name: "受験校管理" })).toHaveAttribute(
      "href",
      "/exam-schools",
    );
  });
});
