import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCompletionCard } from "./TaskCompletionCard";

const card = () => screen.getByRole("region", { name: "タスク達成率" });

const taskCompletion = {
  current: { completed_count: 6, total_count: 12, completion_rate: 50 },
  previous: { completed_count: 3, total_count: 10, completion_rate: 30 },
};

describe("TaskCompletionCard", () => {
  it("期間内の完了タスク数を表示する", () => {
    render(<TaskCompletionCard taskCompletion={taskCompletion} />);
    expect(card()).toHaveTextContent("完了タスク数: 6 / 12");
  });

  it("達成率の前期間比をポイントで表示する", () => {
    render(<TaskCompletionCard taskCompletion={taskCompletion} />);
    expect(screen.getByTestId("trend-label")).toHaveTextContent("+20pt");
  });

  it("集計の基準が期限であることを表示する", () => {
    render(<TaskCompletionCard taskCompletion={taskCompletion} />);
    expect(card()).toHaveTextContent("期限がこの期間内のタスク");
  });

  it("前期間に対象のタスクが無いときは「前期間なし」と表示する", () => {
    render(
      <TaskCompletionCard
        taskCompletion={{
          ...taskCompletion,
          previous: { completed_count: 0, total_count: 0, completion_rate: 0 },
        }}
      />,
    );
    expect(screen.getByTestId("trend-label")).toHaveTextContent("前期間なし");
  });

  it("期間内に対象のタスクが無いときは0件と表示する", () => {
    render(
      <TaskCompletionCard
        taskCompletion={{
          current: { completed_count: 0, total_count: 0, completion_rate: 0 },
          previous: { completed_count: 0, total_count: 0, completion_rate: 0 },
        }}
      />,
    );
    expect(card()).toHaveTextContent("完了タスク数: 0 / 0");
  });
});
