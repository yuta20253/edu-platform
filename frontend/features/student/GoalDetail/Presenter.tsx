"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { Goal } from "./types";

import { statusLabel } from "@/constants/status";
import { TaskStatus } from "@/types/tasks/status";
import { GoalStatus } from "@/types/goals/status";
import { getProgressColor } from "@/libs/ui/progressColor";
import { calcProgress } from "@/libs/domain/progress/calcProgress";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { DeleteGoalDialog } from "@/components/student/DeleteGoalDialog";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  goal: Goal;
  deleteDialogOpen: boolean;
  deleting: boolean;
  deleteError: string | null;
  onDeleteClick: () => void;
  onDeleteDialogClose: () => void;
  onDeleteConfirm: () => void;
};

export const Presenter = ({
  goal,
  deleteDialogOpen,
  deleting,
  deleteError,
  onDeleteClick,
  onDeleteDialogClose,
  onDeleteConfirm,
}: Props) => {
  const progress = calcProgress(goal.tasks ?? []);
  const statusColor = colors.statusUi[goal.status as GoalStatus];
  const progressColor = getProgressColor(progress);
  const tasks = goal.tasks ?? [];

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Link href="/goals" style={{ textDecoration: "none" }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
            mb: 2,
            "&:hover": { color: "primary.main" },
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: 13 }}>目標一覧へ戻る</Typography>
        </Box>
      </Link>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            position: "relative",
            width: 84,
            height: 84,
            flex: "none",
            borderRadius: "50%",
            background: `conic-gradient(${progressColor} ${progress}%, ${colors.border.subtle} 0)`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 7,
              borderRadius: "50%",
              bgcolor: colors.surface.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
              {progress}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Chip
            size="small"
            label={statusLabel[goal.status as GoalStatus]}
            sx={{ bgcolor: statusColor.bg, color: statusColor.text, mb: 0.75 }}
          />
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
            {goal.title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
            期限 {goal.due_date}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...cardSx, p: 2, mb: 3 }}>
        <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>
          {goal.description || "説明はありません"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          タスク一覧
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/goals/${goal.id}/edit`}
            variant="outlined"
            size="small"
          >
            編集
          </Button>
          <Button
            onClick={onDeleteClick}
            variant="outlined"
            size="small"
            color="error"
          >
            削除
          </Button>
        </Box>
      </Box>

      {tasks.length === 0 ? (
        <Box
          sx={{
            ...cardSx,
            p: 3,
            textAlign: "center",
            fontSize: 13,
            color: "text.secondary",
          }}
        >
          タスクはまだありません
        </Box>
      ) : (
        <Box sx={{ ...cardSx, px: 2 }}>
          {tasks.map((task, index) => {
            const taskStatusColor = colors.statusUi[task.status as TaskStatus];

            return (
              <Box
                key={task.id}
                component={Link}
                href={`/goals/${goal.id}/tasks/${task.id}`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1.5,
                  borderBottom:
                    index === tasks.length - 1
                      ? "none"
                      : `1px solid ${colors.border.light}`,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {task.title}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}
                  >
                    期限 {task.due_date}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={statusLabel[task.status as TaskStatus]}
                  sx={{
                    bgcolor: taskStatusColor.bg,
                    color: taskStatusColor.text,
                    flex: "none",
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}

      <DeleteGoalDialog
        open={deleteDialogOpen}
        goalTitle={goal.title}
        onClose={onDeleteDialogClose}
        onConfirm={onDeleteConfirm}
        deleting={deleting}
        error={deleteError}
      />
    </Box>
  );
};
