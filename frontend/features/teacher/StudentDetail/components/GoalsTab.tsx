"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { statusDefinitions } from "@/constants/status";
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { StudentGoal } from "../types";

type Props = {
  goals: StudentGoal[];
};

export const GoalsTab = ({ goals }: Props) => {
  if (goals.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ py: 6, textAlign: "center", color: colors.text.secondary }}
      >
        目標がありません
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {goals.map((goal) => (
        <Card
          key={goal.id}
          elevation={0}
          sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {goal.title}
              </Typography>
              <StatusBadge
                status={goal.status}
                definitions={statusDefinitions}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5, color: colors.text.muted }}
            >
              {goal.due_date ? `期限: ${goal.due_date}` : "期限なし"}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2,
                mb: 0.5,
              }}
            >
              <Typography variant="body2">
                タスク完了 {goal.progress.task_completed_count}/
                {goal.progress.task_total_count}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {goal.progress.completion_rate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={goal.progress.completion_rate}
              sx={{ height: 6, borderRadius: 999 }}
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
