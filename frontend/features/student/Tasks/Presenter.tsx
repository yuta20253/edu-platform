"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { statusLabel } from "@/constants/status";
import {
  Box,
  Chip,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Task, TasksData, TaskStatusFilter } from "./types";

type Props = {
  data: TasksData;
  page: number;
  onPageChange: (page: number) => void;
  status: TaskStatusFilter;
  onStatusChange: (status: TaskStatusFilter) => void;
};

const filters: { value: TaskStatusFilter; label: string }[] = [
  { value: "active", label: "未完了" },
  { value: "not_started", label: statusLabel.not_started },
  { value: "in_progress", label: statusLabel.in_progress },
  { value: "completed", label: statusLabel.completed },
];

const TaskRow = ({ task }: { task: Task }) => {
  const statusColor = colors.statusUi[task.status];

  return (
    <Box
      component={Link}
      href={`/tasks/${task.id}`}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1.25,
        py: 1.75,
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            textDecoration:
              task.status === "completed" ? "line-through" : "none",
          }}
        >
          {task.title}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
          期限 {task.due_date}
        </Typography>
      </Box>
      <Chip
        size="small"
        label={statusLabel[task.status]}
        sx={{
          flex: "none",
          bgcolor: statusColor.bg,
          color: statusColor.text,
        }}
      />
    </Box>
  );
};

export const Presenter = ({
  data,
  page,
  onPageChange,
  status,
  onStatusChange,
}: Props) => {
  const { tasks, meta } = data;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 2 }}
      >
        タスク
      </Typography>

      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={status}
        onChange={(_, value: TaskStatusFilter | null) => {
          if (value) onStatusChange(value);
        }}
        aria-label="ステータスで絞り込み"
        sx={{
          bgcolor: colors.surface.light,
          borderRadius: `${radius.sm}px`,
          p: 0.5,
          gap: 0.5,
          "& .MuiToggleButtonGroup-grouped": {
            border: 0,
            borderRadius: `${radius.sm - 2}px !important`,
            fontSize: 12,
            fontWeight: 700,
            color: "text.secondary",
            "&.Mui-selected, &.Mui-selected:hover": {
              bgcolor: colors.surface.white,
              color: "primary.main",
              boxShadow: `0 1px 3px ${colors.shadow.footer}`,
            },
          },
        }}
      >
        {filters.map((f) => (
          <ToggleButton key={f.value} value={f.value}>
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ mt: 1 }}>
        {!tasks || tasks.length === 0 ? (
          <Typography
            sx={{
              py: 8,
              textAlign: "center",
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            タスクが見つかりません
          </Typography>
        ) : (
          tasks.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </Box>

      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
