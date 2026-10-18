import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { colors } from "@/app/theme/colors";
import { formatStudyMinutes, minutesTrend } from "../formatters";
import type { AnalyticsSummary } from "../types";
import { DashboardCard } from "./DashboardCard";
import { TrendLabel } from "./TrendLabel";

type Unit = AnalyticsSummary["study_minutes"]["unit"];

type Props = {
  studyMinutes: AnalyticsSummary["study_minutes"];
};

// "2026-10-05" → "10/5"。Date に変換するとタイムゾーンで日付がずれうるため文字列から組み立てる
export const axisLabel = (date: string, unit: Unit) => {
  const [, month, day] = date.split("-").map(Number);
  return unit === "week" ? `${month}/${day}〜` : `${month}/${day}`;
};

export const StudyMinutesChart = ({ studyMinutes }: Props) => {
  const { unit, series, total } = studyMinutes;

  return (
    <DashboardCard title="学習時間">
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
          <Typography
            component="span"
            sx={{ fontSize: 13, fontWeight: 700, mr: 0.5 }}
          >
            合計
          </Typography>
          {formatStudyMinutes(total.current)}
        </Typography>
        <TrendLabel trend={minutesTrend(total.current, total.previous)} />
      </Box>

      <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
        {unit === "week" ? "週ごと" : "日ごと"}の学習時間(分)
      </Typography>
      <BarChart
        height={200}
        hideLegend
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        xAxis={[
          {
            scaleType: "band",
            data: series.map((point) => axisLabel(point.date, unit)),
          },
        ]}
        yAxis={[{ min: 0, width: 32 }]}
        series={[
          {
            label: "学習時間(分)",
            data: series.map((point) => point.minutes),
            color: colors.accent[600],
          },
        ]}
      />
      {total.current === 0 && (
        <Typography
          sx={{ fontSize: 13, color: "text.secondary", textAlign: "center" }}
        >
          この期間の学習記録はありません
        </Typography>
      )}
    </DashboardCard>
  );
};
