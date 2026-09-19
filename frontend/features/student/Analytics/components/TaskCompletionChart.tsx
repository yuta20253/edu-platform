import { Box, Typography } from "@mui/material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { colors } from "@/app/theme/colors";
import { TaskCompletionData } from "../types";

type Props = {
  data: TaskCompletionData;
};

export const TaskCompletionChart = ({ data }: Props) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Gauge
        width={200}
        height={200}
        value={data.completion_rate}
        valueMax={100}
        text={({ value }) => `${value ?? 0}%`}
        sx={{
          [`& .${gaugeClasses.valueArc}`]: { fill: colors.brand.primary },
        }}
      />
      <Typography>
        完了タスク数: {data.completed_count} / {data.total_count}
      </Typography>
    </Box>
  );
};
