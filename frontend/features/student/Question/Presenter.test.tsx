import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { QuestionType } from "@/types/question/question";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockQuestion: QuestionType = {
  id: 1,
  unit_id: 11,
  course_id: 1,
  question_text: "1 + 1 は？",
  answered: false,
  question_hints: [
    { id: 1, question_id: 1, step_number: 1, hint_text: "指を使って数えよう" },
  ],
  question_choices: [
    { id: 101, question_id: 1, choice_number: 1, choice_text: "1" },
    { id: 102, question_id: 1, choice_number: 2, choice_text: "2" },
  ],
};

const defaultProps = {
  goalId: undefined as number | undefined,
  taskId: 5,
  unitId: 11,
  question: mockQuestion,
  currentIndex: 0,
  totalCount: 3,
  selectedChoiceId: null as number | null,
  isCorrect: null as boolean | null,
  isAnswered: false,
  isLastQuestion: false,
  openedHintStep: 0,
  isSubmitting: false,
  onAnswer: vi.fn(),
  onSkip: vi.fn(),
  onNextQuestion: vi.fn(),
  onOpenHint: vi.fn(),
  onCloseHint: vi.fn(),
};

describe("QuestionPresenter", () => {
  it("問題文と選択肢が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("1 + 1 は？")).toBeInTheDocument();
    expect(screen.getByText("1. 1")).toBeInTheDocument();
    expect(screen.getByText("2. 2")).toBeInTheDocument();
  });

  it("現在の問題番号と全体数が表示される", () => {
    render(<Presenter {...defaultProps} currentIndex={0} totalCount={3} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("選択肢をクリックするとonAnswerが選択肢IDで呼ばれる", () => {
    const onAnswer = vi.fn();
    render(<Presenter {...defaultProps} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText("1. 1"));
    expect(onAnswer).toHaveBeenCalledWith(101);
  });

  it("isAnsweredのとき選択肢ボタンが無効になる", () => {
    render(<Presenter {...defaultProps} isAnswered />);
    expect(screen.getByText("1. 1").closest("button")).toBeDisabled();
  });

  it("isSubmitting中は選択肢ボタンが無効になる", () => {
    render(<Presenter {...defaultProps} isSubmitting />);
    expect(screen.getByText("1. 1").closest("button")).toBeDisabled();
  });

  it("正解のとき「正解！」が表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        isAnswered
        isCorrect
        selectedChoiceId={101}
      />,
    );
    expect(screen.getByText("正解！")).toBeInTheDocument();
  });

  it("不正解のとき「不正解」が表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        isAnswered
        isCorrect={false}
        selectedChoiceId={101}
      />,
    );
    expect(screen.getByText("不正解")).toBeInTheDocument();
  });

  it("ヒントを見るをクリックするとonOpenHintがstep_numberで呼ばれる", () => {
    const onOpenHint = vi.fn();
    render(<Presenter {...defaultProps} onOpenHint={onOpenHint} />);
    fireEvent.click(screen.getByText("ヒント 1 を見る"));
    expect(onOpenHint).toHaveBeenCalledWith(1);
  });

  it("openedHintStepが一致するとヒント本文が表示され、閉じるでonCloseHintが呼ばれる", () => {
    const onCloseHint = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        openedHintStep={1}
        onCloseHint={onCloseHint}
      />,
    );
    expect(screen.getByText("指を使って数えよう")).toBeInTheDocument();
    fireEvent.click(screen.getByText("閉じる"));
    expect(onCloseHint).toHaveBeenCalledTimes(1);
  });

  it("「スタート画面へ」リンクがgoalIdなしのタスクパスを指す", () => {
    render(<Presenter {...defaultProps} />);
    const link = screen.getByRole("link", { name: /スタート画面へ/ });
    expect(link).toHaveAttribute("href", "/tasks/5/units/11");
  });

  it("goalIdがあるとき「スタート画面へ」リンクがgoals配下のタスクパスを指す", () => {
    render(<Presenter {...defaultProps} goalId={3} />);
    const link = screen.getByRole("link", { name: /スタート画面へ/ });
    expect(link).toHaveAttribute("href", "/goals/3/tasks/5/units/11");
  });

  it("未回答時は「スキップ」でonSkipが呼ばれる", () => {
    const onSkip = vi.fn();
    render(<Presenter {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("スキップ"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("回答済み・最終問題でない場合は「次へ」でonNextQuestionが呼ばれる", () => {
    const onNextQuestion = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        isAnswered
        isLastQuestion={false}
        onNextQuestion={onNextQuestion}
      />,
    );
    fireEvent.click(screen.getByText("次へ"));
    expect(onNextQuestion).toHaveBeenCalledTimes(1);
  });

  it("回答済み・最終問題の場合は「結果を見る」が表示されクリックでonNextQuestionが呼ばれる", () => {
    const onNextQuestion = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        isAnswered
        isLastQuestion
        onNextQuestion={onNextQuestion}
      />,
    );
    fireEvent.click(screen.getByText("結果を見る"));
    expect(onNextQuestion).toHaveBeenCalledTimes(1);
  });
});
