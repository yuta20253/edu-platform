import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Presenter } from "./Presenter";
import type { UnitType } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockUnit: UnitType = {
  id: 11,
  course_id: 1,
  unit_name: "二次関数",
  course: {
    id: 1,
    level_number: 1,
    level_name: "標準",
  },
};

const defaultProps = {
  goalId: undefined as number | undefined,
  taskId: 5,
  unitId: 11,
  unit: mockUnit,
  onStart: vi.fn(),
  isStarting: false,
};

describe("UnitPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("講座レベル・単元名が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("標準レベル1")).toBeInTheDocument();
    expect(screen.getByText("二次関数")).toBeInTheDocument();
  });

  it("「スタート」ボタンをクリックするとonStartが呼ばれる", () => {
    const onStart = vi.fn();
    render(<Presenter {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "スタート" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("isStarting中はボタンにスピナーと「開始中...」が表示される", () => {
    render(<Presenter {...defaultProps} isStarting />);
    const button = screen.getByRole("button", { name: "開始中..." });
    expect(button).toBeDisabled();
    expect(within(button).getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "スタート" }),
    ).not.toBeInTheDocument();
  });

  it("isStartingでないときはスピナーが表示されない", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("「タスク詳細へ戻る」リンクがgoalIdなしのタスクパスを指す", () => {
    render(<Presenter {...defaultProps} />);
    const link = screen.getByRole("link", { name: /タスク詳細へ戻る/ });
    expect(link).toHaveAttribute("href", "/tasks/5");
  });

  it("goalIdがあるとき「タスク詳細へ戻る」リンクがgoals配下のタスクパスを指す", () => {
    render(<Presenter {...defaultProps} goalId={3} />);
    const link = screen.getByRole("link", { name: /タスク詳細へ戻る/ });
    expect(link).toHaveAttribute("href", "/goals/3/tasks/5");
  });
});
