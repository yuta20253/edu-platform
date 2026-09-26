"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { statusLabel } from "@/constants/status";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import Link from "next/link";
import { Task } from "./types";

type Props = {
  task: Task;
  goalId?: number;
};

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

export const Presenter = ({ task, goalId }: Props) => {
  const statusColor = colors.statusUi[task.status];
  const editHref = goalId
    ? `/goals/${goalId}/tasks/${task.id}/edit`
    : `/tasks/${task.id}/edit`;
  const backHref = goalId ? `/goals/${goalId}` : "/tasks";
  const backLabel = goalId ? "目標詳細に戻る" : "タスク一覧に戻る";

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1,
          mb: 2,
          gap: 2,
        }}
      >
        <Box
          component={Link}
          href={backHref}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
            fontSize: 14,
            "&:hover": { color: "primary.main" },
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          {backLabel}
        </Box>
        <Button
          component={Link}
          href={editHref}
          variant="outlined"
          size="small"
          sx={{ whiteSpace: "nowrap", px: 2 }}
        >
          編集する
        </Button>
      </Box>

      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, lineHeight: 1.4, textWrap: "pretty" }}
      >
        {task.title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          期限：{task.due_date}
        </Typography>
        <Chip
          size="small"
          label={statusLabel[task.status]}
          sx={{ bgcolor: statusColor?.bg, color: statusColor?.text }}
        />
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Box sx={{ ...cardSx, p: 2, minHeight: 96 }}>
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            color: "text.primary",
          }}
        >
          {task.content || "内容はまだ入力されていません。"}
        </Typography>
      </Box>

      <Typography
        variant="subtitle2"
        component="h2"
        sx={{ fontWeight: 800, mt: 3, mb: 1.5 }}
      >
        単元
      </Typography>

      {task.units && task.units.length > 0 ? (
        task.units.map((unit) => {
          const unitHref = goalId
            ? `/goals/${goalId}/tasks/${task.id}/units/${unit.id}`
            : `/tasks/${task.id}/units/${unit.id}`;
          return (
            <Box
              key={unit.id}
              sx={{
                ...cardSx,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.5,
                mb: 1.25,
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {unit.course.level_name}レベル{unit.course.level_number} -{" "}
                {unit.unit_name}
              </Typography>
              <Button
                component={Link}
                href={unitHref}
                variant="contained"
                size="small"
                sx={{ flex: "none" }}
              >
                学習
              </Button>
            </Box>
          );
        })
      ) : (
        <Box
          sx={{
            ...cardSx,
            p: 2,
            color: "text.secondary",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          紐づく単元はありません
        </Box>
      )}
    </Box>
  );
};
