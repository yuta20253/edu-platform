import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnalyticsContent } from "./AnalyticsContent";

describe("AnalyticsContent", () => {
  it("resultがnullの場合はデータがありませんと表示する", () => {
    render(
      <AnalyticsContent
        type="task_completion"
        result={null}
        courseId={null}
        unitId={null}
      />,
    );
    expect(screen.getByText("データがありません")).toBeInTheDocument();
  });

  it("course_rankでcourseId未選択の場合は案内メッセージを表示する", () => {
    render(
      <AnalyticsContent
        type="course_rank"
        result={null}
        courseId={null}
        unitId={null}
      />,
    );
    expect(
      screen.getByText("教科とコースを選択してください"),
    ).toBeInTheDocument();
  });

  it("unit_rankでunitId未選択の場合は案内メッセージを表示する", () => {
    render(
      <AnalyticsContent
        type="unit_rank"
        result={null}
        courseId={1}
        unitId={null}
      />,
    );
    expect(
      screen.getByText("コースと単元を選択してください"),
    ).toBeInTheDocument();
  });

  it("task_completionのデータが渡されるとタスク達成率を表示する", () => {
    render(
      <AnalyticsContent
        type="task_completion"
        result={{
          type: "task_completion",
          data: { completed_count: 3, total_count: 5, completion_rate: 60 },
        }}
        courseId={null}
        unitId={null}
      />,
    );
    expect(screen.getByText("完了タスク数: 3 / 5")).toBeInTheDocument();
  });

  it("course_rankのデータが渡されると順位を表示する", () => {
    render(
      <AnalyticsContent
        type="course_rank"
        result={{ type: "course_rank", data: { rank: 3, total_users: 30 } }}
        courseId={1}
        unitId={null}
      />,
    );
    expect(screen.getByText("30人中 3位")).toBeInTheDocument();
  });
});
