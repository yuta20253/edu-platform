import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TaskCompletionChart } from "./TaskCompletionChart";

describe("TaskCompletionChart", () => {
  it("完了タスク数を表示する", () => {
    render(
      <TaskCompletionChart
        data={{ completed_count: 2, total_count: 4, completion_rate: 50 }}
      />,
    );
    expect(screen.getByText("完了タスク数: 2 / 4")).toBeInTheDocument();
  });

  it("タスクが0件でも表示が崩れない", () => {
    render(
      <TaskCompletionChart
        data={{ completed_count: 0, total_count: 0, completion_rate: 0 }}
      />,
    );
    expect(screen.getByText("完了タスク数: 0 / 0")).toBeInTheDocument();
  });
});
