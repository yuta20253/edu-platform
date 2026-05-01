"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { Goal } from "./types";
import { calcProgress } from "./utils/calcProgress";
import { getProgressColor } from "./utils/progressColor";
import { GoalStatus } from "@/types/goals/status";
import { statusLabel } from "@/constants/status";
import { TaskStatus } from "@/types/tasks/status";

type Props = {
  goal: Goal;
};

export const Presenter = ({ goal }: Props) => {
  const progress = calcProgress(goal.tasks);
  const statusColor = colors.statusUi[goal.status as GoalStatus];
  const progressColor = getProgressColor(progress);

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          my: 4,
          textAlign: "center",
        }}
      >
        目標詳細
      </Typography>

      <Box sx={{ textAlign: "start", mb: 3 }}>
        <Button component={Link} href="/goals" variant="outlined" size="small">
          一覧へ戻る
        </Button>
      </Box>

      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "min(720px, 90vw)",
            borderRadius: 3,
            boxShadow: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: 20 }}>
              {goal.title}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 1,
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                期限: {goal.due_date}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  px: 1,
                  py: 0.3,
                  borderRadius: 1,
                  bgcolor: statusColor?.bg,
                  color: statusColor?.text,
                }}
              >
                {statusLabel[goal.status as GoalStatus]}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.border.subtle,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: progressColor,
                    },
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 12, minWidth: 40 }}>
                {progress}%
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography
              sx={{
                lineHeight: 1.7,
                p: 2,
                mt: 1,
                borderRadius: 2,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              {goal.description || "説明はありません"}
            </Typography>
            <Box sx={{ textAlign: "end", mt: 3 }}>
              <Button
                component={Link}
                href={`/goals/${goal.id}/edit`}
                variant="outlined"
                size="small"
              >
                編集
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box mt={5} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          タスク一覧
        </Typography>

        {!goal.tasks || goal.tasks.length === 0 ? (
          <Typography color="text.secondary">タスクはまだありません</Typography>
        ) : (
          goal.tasks.map((task) => {
            const statusColor = colors.statusUi[task.status as TaskStatus];
            return (
              <Card
                key={task.id}
                component={Link}
                href={`/goals/${goal.id}/tasks/${task.id}`}
                sx={{
                  width: "min(720px, 90vw)",
                  borderRadius: 3,
                  boxShadow: 1,
                  mb: 2,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {task.title}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      期限: {task.due_date}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        bgcolor: statusColor,
                        color: statusColor,
                      }}
                    >
                      {statusLabel[task.status as TaskStatus]}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
    </Box>
  );
};
