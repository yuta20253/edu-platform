import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnalyticsSummary } from "../types";
import { StudyMinutesChart, axisLabel } from "./StudyMinutesChart";

const card = () => screen.getByRole("region", { name: "学習時間" });

const studyMinutes: AnalyticsSummary["study_minutes"] = {
  unit: "day",
  series: [
    { date: "2026-10-12", minutes: 30 },
    { date: "2026-10-13", minutes: 180 },
  ],
  total: { current: 210, previous: 150 },
};

describe("StudyMinutesChart", () => {
  it("期間内の合計学習時間を表示する", () => {
    render(<StudyMinutesChart studyMinutes={studyMinutes} />);
    expect(card()).toHaveTextContent("合計3時間30分");
  });

  it("合計学習時間の前期間比を表示する", () => {
    render(<StudyMinutesChart studyMinutes={studyMinutes} />);
    expect(screen.getByTestId("trend-label")).toHaveTextContent("+40%");
  });

  it("棒グラフを描画する", () => {
    const { container } = render(
      <StudyMinutesChart studyMinutes={studyMinutes} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("日別のときは日ごとの学習時間であることを表示する", () => {
    render(<StudyMinutesChart studyMinutes={studyMinutes} />);
    expect(card()).toHaveTextContent("日ごとの学習時間(分)");
  });

  it("週別のときは週ごとの合計であることを表示する", () => {
    render(
      <StudyMinutesChart studyMinutes={{ ...studyMinutes, unit: "week" }} />,
    );
    expect(card()).toHaveTextContent("週ごとの学習時間(分)");
  });

  it("学習記録が0件のときは0分と表示し、記録が無いことを伝える", () => {
    render(
      <StudyMinutesChart
        studyMinutes={{
          unit: "day",
          series: [
            { date: "2026-10-12", minutes: 0 },
            { date: "2026-10-13", minutes: 0 },
          ],
          total: { current: 0, previous: 0 },
        }}
      />,
    );
    expect(card()).toHaveTextContent("合計0分");
    expect(card()).toHaveTextContent("この期間の学習記録はありません");
  });
});

describe("axisLabel", () => {
  it("日別は「月/日」にする", () => {
    expect(axisLabel("2026-10-05", "day")).toBe("10/5");
  });

  it("週別は週の初日に「〜」を付ける", () => {
    expect(axisLabel("2026-07-21", "week")).toBe("7/21〜");
  });
});
