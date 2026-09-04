import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { QuestionHistory } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockHistories: QuestionHistory[] = [
  {
    question_id: 1,
    question_text: "1 + 1 は？",
    correct_answer: "B",
    is_correct: true,
    selected_choice_number: 2,
    status: "answered",
  },
  {
    question_id: 2,
    question_text: "2 + 2 は？",
    correct_answer: "C",
    is_correct: false,
    selected_choice_number: 3,
    status: "answered",
  },
  {
    question_id: 3,
    question_text: "3 + 3 は？",
    correct_answer: "D",
    is_correct: false,
    selected_choice_number: 0,
    status: "unanswered",
  },
];

const defaultProps = {
  goalId: undefined as number | undefined,
  taskId: 5,
  unitId: 11,
  questionHistories: mockHistories,
};

describe("QuestionConfirmationPresenter", () => {
  it("回答数が「回答済み件数 / 全体件数」で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("2 / 3 問回答")).toBeInTheDocument();
  });

  it("各問題の問題文が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("1 + 1 は？")).toBeInTheDocument();
    expect(screen.getByText("2 + 2 は？")).toBeInTheDocument();
    expect(screen.getByText("3 + 3 は？")).toBeInTheDocument();
  });

  it("正解した問題には「正解」チップが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("正解")).toBeInTheDocument();
  });

  it("不正解の問題には「不正解」チップが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("不正解")).toBeInTheDocument();
  });

  it("未回答の問題には「未回答」チップとあなたの回答欄に「未回答」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const unansweredLabels = screen.getAllByText("未回答");
    expect(unansweredLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("正答が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("「タスク一覧へ」と「もう一度解く」のリンクがgoalIdなしのパスを指す", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "タスク一覧へ" })).toHaveAttribute(
      "href",
      "/tasks",
    );
    expect(screen.getByRole("link", { name: "もう一度解く" })).toHaveAttribute(
      "href",
      "/tasks/5/units/11",
    );
  });

  it("goalIdがあるときリンクがgoals配下のパスを指す", () => {
    render(<Presenter {...defaultProps} goalId={3} />);
    expect(screen.getByRole("link", { name: "タスク一覧へ" })).toHaveAttribute(
      "href",
      "/goals/3",
    );
    expect(screen.getByRole("link", { name: "もう一度解く" })).toHaveAttribute(
      "href",
      "/goals/3/tasks/5/units/11",
    );
  });

  it("questionHistoriesが空のとき「0 / 0 問回答」と表示される", () => {
    render(<Presenter {...defaultProps} questionHistories={[]} />);
    expect(screen.getByText("0 / 0 問回答")).toBeInTheDocument();
  });
});
