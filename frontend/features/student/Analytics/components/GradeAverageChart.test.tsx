import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GradeAverageChart } from "./GradeAverageChart";

describe("GradeAverageChart", () => {
  it("エラーなく描画される", () => {
    const { container } = render(
      <GradeAverageChart
        data={{
          correct_rate: { my: 60, average: 55 },
          task_completion_rate: { my: 50, average: 45 },
        }}
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("平均が0件でもエラーなく描画される", () => {
    const { container } = render(
      <GradeAverageChart
        data={{
          correct_rate: { my: 0, average: 0 },
          task_completion_rate: { my: 0, average: 0 },
        }}
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
