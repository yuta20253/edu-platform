import { colors } from "@/app/theme/colors";
import type { DailyActivity } from "./types";

// "2026-09-05" → "9/5"
const formatAxisDate = (value: string) => {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
};

// 日別推移グラフの軸・系列定義。
// APIが記録の無い日も0埋めして返すため、ここでは欠損補完をしない。
export const buildActivityChart = (
  daily: DailyActivity[],
  showAccuracy: boolean,
) => {
  const xAxis = [
    {
      id: "date",
      scaleType: "point" as const,
      data: daily.map((d) => d.date),
      valueFormatter: formatAxisDate,
    },
  ];

  const yAxis = [
    { id: "students", position: "left" as const, min: 0 },
    { id: "answers", position: "right" as const, min: 0 },
    ...(showAccuracy
      ? [
          {
            id: "accuracy",
            position: "right" as const,
            min: 0,
            max: 100,
          },
        ]
      : []),
  ];

  const series = [
    {
      type: "line" as const,
      id: "active_student_count",
      label: "アクティブ生徒数",
      yAxisId: "students",
      color: colors.kpi.blue,
      data: daily.map((d) => d.active_student_count),
    },
    {
      type: "line" as const,
      id: "answer_count",
      label: "解答数",
      yAxisId: "answers",
      color: colors.kpi.amber,
      data: daily.map((d) => d.answer_count),
    },
    ...(showAccuracy
      ? [
          {
            type: "line" as const,
            id: "accuracy_rate",
            label: "正答率(%)",
            yAxisId: "accuracy",
            color: colors.kpi.green,
            data: daily.map((d) => d.accuracy_rate),
          },
        ]
      : []),
  ];

  return { xAxis, yAxis, series };
};
