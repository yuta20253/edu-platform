import { describe, expect, it } from "vitest";
import { buildActivityChart } from "./activityChartConfig";
import type { DailyActivity } from "./types";

const daily: DailyActivity[] = [
  {
    date: "2026-09-29",
    active_student_count: 40,
    answer_count: 380,
    accuracy_rate: 67.2,
  },
  {
    date: "2026-09-30",
    active_student_count: 0,
    answer_count: 0,
    accuracy_rate: 0,
  },
];

describe("buildActivityChart", () => {
  it("X軸に全日分の日付を渡す(欠損補完はAPI側の責務)", () => {
    const { xAxis } = buildActivityChart(daily, false);
    expect(xAxis[0].data).toEqual(["2026-09-29", "2026-09-30"]);
  });

  it("X軸の表示は「M/d」形式に整形する", () => {
    const { xAxis } = buildActivityChart(daily, false);
    expect(xAxis[0].valueFormatter?.("2026-09-05")).toBe("9/5");
  });

  it("既定では日別アクティブ生徒数と日別解答数の2系列を返す", () => {
    const { series } = buildActivityChart(daily, false);
    expect(series.map((s) => s.label)).toEqual([
      "アクティブ生徒数",
      "解答数",
    ]);
    expect(series[0].data).toEqual([40, 0]);
    expect(series[1].data).toEqual([380, 0]);
  });

  it("アクティブ生徒数は左軸、解答数は右軸に割り当てる", () => {
    const { series, yAxis } = buildActivityChart(daily, false);
    expect(series.map((s) => s.yAxisId)).toEqual(["students", "answers"]);
    expect(yAxis.find((a) => a.id === "students")?.position).toBe("left");
    expect(yAxis.find((a) => a.id === "answers")?.position).toBe("right");
  });

  it("正答率トグルがONのときだけ正答率系列(0〜100の軸)を追加する", () => {
    const off = buildActivityChart(daily, false);
    const on = buildActivityChart(daily, true);

    expect(off.series.some((s) => s.label === "正答率(%)")).toBe(false);
    const accuracy = on.series.find((s) => s.label === "正答率(%)");
    expect(accuracy?.data).toEqual([67.2, 0]);
    expect(accuracy?.yAxisId).toBe("accuracy");
    expect(on.yAxis.find((a) => a.id === "accuracy")).toMatchObject({
      min: 0,
      max: 100,
    });
  });

  it("データが空でもエラーにならない", () => {
    const { xAxis, series } = buildActivityChart([], true);
    expect(xAxis[0].data).toEqual([]);
    expect(series.every((s) => s.data?.length === 0)).toBe(true);
  });
});
