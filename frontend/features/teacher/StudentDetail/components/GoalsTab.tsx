"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { statusDefinitions } from "@/constants/status";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { StudentGoal } from "../types";
import { DueDateLabel } from "./DueDateLabel";

type Props = {
  goals: StudentGoal[];
};

type SummaryItem = {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
};

const buildSummary = (goals: StudentGoal[]): SummaryItem[] => {
  const completedGoalCount = goals.filter(
    (goal) => goal.status === "completed",
  ).length;
  const taskCompletedCount = goals.reduce(
    (sum, goal) => sum + goal.progress.task_completed_count,
    0,
  );
  const taskTotalCount = goals.reduce(
    (sum, goal) => sum + goal.progress.task_total_count,
    0,
  );

  return [
    {
      label: "目標数",
      value: `${goals.length}件`,
      icon: <FlagOutlinedIcon />,
      color: colors.kpi.blue,
    },
    {
      label: "達成した目標",
      value: `${completedGoalCount}件`,
      icon: <EmojiEventsOutlinedIcon />,
      color: colors.kpi.green,
    },
    {
      label: "タスク完了",
      value: `${taskCompletedCount}/${taskTotalCount}`,
      icon: <TaskAltIcon />,
      color: colors.kpi.purple,
    },
  ];
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
    <Stack spacing={3}>
      <Box component="section" aria-label="目標のサマリー">
        <Grid container spacing={2}>
          {buildSummary(goals).map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: 2,
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Avatar sx={{ bgcolor: item.color, width: 44, height: 44 }}>
                    {item.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: colors.text.secondary }}
                    >
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Stack spacing={2}>
        {goals.map((goal) => (
          <Card
            key={goal.id}
            elevation={0}
            sx={{
              border: `1px solid ${colors.border.light}`,
              borderLeft: `4px solid ${colors.statusUi[goal.status].text}`,
              borderRadius: 2,
            }}
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

              <Box sx={{ mt: 0.5 }}>
                <DueDateLabel dueDate={goal.due_date} status={goal.status} />
              </Box>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      mb: 0.75,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      タスク完了 {goal.progress.task_completed_count}/
                      {goal.progress.task_total_count}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {goal.progress.completion_rate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={goal.progress.completion_rate}
                    aria-label={`${goal.title}のタスク完了率`}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  {goal.tasks.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.muted }}
                    >
                      タスクはまだありません
                    </Typography>
                  ) : (
                    <Stack
                      spacing={0.75}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: colors.surface.default,
                      }}
                    >
                      {goal.tasks.map((task) => (
                        <Box
                          key={task.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <StatusBadge
                            status={task.status}
                            definitions={statusDefinitions}
                          />
                          <Typography variant="body2" noWrap>
                            {task.title}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};
