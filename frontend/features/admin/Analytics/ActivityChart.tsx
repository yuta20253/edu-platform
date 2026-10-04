"use client";

import { colors } from "@/app/theme/colors";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Box,
  Card,
  CardContent,
  ToggleButton,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useState } from "react";
import { buildActivityChart } from "./activityChartConfig";
import type { DailyActivity } from "./types";

type Props = {
  data: DailyActivity[];
};

const CHART_HEIGHT = 320;

export const ActivityChart = ({ data }: Props) => {
  const [showAccuracy, setShowAccuracy] = useState(false);
  const { xAxis, yAxis, series } = buildActivityChart(data, showAccuracy);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: 2,
        mb: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            日別の学習推移
          </Typography>
          <ToggleButton
            value="accuracy"
            size="small"
            selected={showAccuracy}
            aria-pressed={showAccuracy}
            onChange={() => setShowAccuracy((prev) => !prev)}
            sx={{ textTransform: "none" }}
          >
            正答率を表示
          </ToggleButton>
        </Box>

        {data.length === 0 ? (
          <EmptyState message="対象期間にデータがありません" />
        ) : (
          <LineChart
            height={CHART_HEIGHT}
            xAxis={xAxis}
            yAxis={yAxis}
            series={series}
          />
        )}
      </CardContent>
    </Card>
  );
};
