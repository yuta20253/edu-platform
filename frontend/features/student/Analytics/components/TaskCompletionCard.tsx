import { Box, Typography } from "@mui/material";
import { rateTrend } from "../formatters";
import type { AnalyticsSummary } from "../types";
import { DashboardCard } from "./DashboardCard";
import { TaskCompletionChart } from "./TaskCompletionChart";
import { TrendLabel } from "./TrendLabel";

type Props = {
  taskCompletion: AnalyticsSummary["task_completion"];
};

export const TaskCompletionCard = ({ taskCompletion }: Props) => {
  const { current, previous } = taskCompletion;
  // 前期間に対象タスクが無いと達成率は0%になるが、比較の意味がないため「前期間なし」にする
  const trend = rateTrend(
    current.completion_rate,
    previous.total_count === 0 ? null : previous.completion_rate,
  );

  return (
    <DashboardCard title="タスク達成率">
      <TaskCompletionChart data={current} />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <TrendLabel trend={trend} />
      </Box>
      <Typography
        sx={{
          mt: 1,
          fontSize: 12,
          color: "text.secondary",
          textAlign: "center",
        }}
      >
        期限がこの期間内のタスクで集計しています
      </Typography>
    </DashboardCard>
  );
};
