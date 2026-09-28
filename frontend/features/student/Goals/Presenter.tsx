"use client";

import { Box, Typography, IconButton, Chip, Pagination } from "@mui/material";
import Link from "next/link";
import { GoalsData } from "./types";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { GoalStatus } from "@/types/goals/status";
import { statusLabel } from "@/constants/status";
import { getProgressColor } from "@/libs/ui/progressColor";
import { calcProgress } from "@/libs/domain/progress/calcProgress";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { DeleteGoalDialog } from "@/components/student/DeleteGoalDialog";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type DeleteTarget = { id: number; title: string } | null;

type Props = {
  data: GoalsData;
  page: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (id: number, title: string) => void;
  deleteTarget: DeleteTarget;
  deleting: boolean;
  deleteError: string | null;
  onDeleteDialogClose: () => void;
  onDeleteConfirm: () => void;
};

export const Presenter = ({
  data,
  page,
  onPageChange,
  onDeleteClick,
  deleteTarget,
  deleting,
  deleteError,
  onDeleteDialogClose,
  onDeleteConfirm,
}: Props) => {
  const { goals, meta } = data;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          目標一覧
        </Typography>
        <IconButton
          component={Link}
          href="/goals/new"
          aria-label="目標を追加"
          sx={{
            bgcolor: "primary.main",
            color: colors.text.inverse,
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {!goals || goals.length === 0 ? (
        <Box
          sx={{
            ...cardSx,
            p: 3,
            textAlign: "center",
            fontSize: 13,
            color: "text.secondary",
          }}
        >
          目標が見つかりません
        </Box>
      ) : (
        <>
          {goals.map((goal) => {
            const progress = calcProgress(goal.tasks);
            const statusColor = colors.statusUi[goal.status as GoalStatus];
            const progressColor = getProgressColor(progress);

            return (
              <Box key={goal.id} sx={{ ...cardSx, px: 2, py: 1.75, mb: 1.25 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Chip
                      size="small"
                      label={statusLabel[goal.status as GoalStatus]}
                      sx={{
                        bgcolor: statusColor.bg,
                        color: statusColor.text,
                        mb: 0.75,
                      }}
                    />
                    <Typography
                      component={Link}
                      href={`/goals/${goal.id}`}
                      sx={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      {goal.title}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}
                    >
                      期限 {goal.due_date}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      flex: "none",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: 15, mr: 0.5 }}>
                      {progress}%
                    </Typography>
                    <IconButton
                      component={Link}
                      href={`/goals/${goal.id}/edit`}
                      aria-label="編集"
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="削除"
                      size="small"
                      onClick={() => onDeleteClick(goal.id, goal.title)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    bgcolor: colors.border.subtle,
                    borderRadius: 999,
                    overflow: "hidden",
                    mt: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${progress}%`,
                      bgcolor: progressColor,
                      borderRadius: 999,
                    }}
                  />
                </Box>
              </Box>
            );
          })}

          {meta.total_pages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}
            >
              <Pagination
                count={meta.total_pages}
                page={page}
                onChange={(_, value) => onPageChange(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      <DeleteGoalDialog
        open={!!deleteTarget}
        goalTitle={deleteTarget?.title ?? ""}
        onClose={onDeleteDialogClose}
        onConfirm={onDeleteConfirm}
        deleting={deleting}
        error={deleteError}
      />
    </Box>
  );
};
