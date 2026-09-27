"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { UnitType } from "./types";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  unit: UnitType;
  onStart: () => void;
  isStarting: boolean;
};

export const Presenter = ({
  goalId,
  taskId,
  unit,
  onStart,
  isStarting,
}: Props) => {
  const taskHref = goalId
    ? `/goals/${goalId}/tasks/${taskId}`
    : `/tasks/${taskId}`;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: { xs: 2, md: 0 } }}>
      <Link href={taskHref} style={{ textDecoration: "none" }}>
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
          <Typography sx={{ fontSize: 13 }}>タスク詳細へ戻る</Typography>
        </Box>
      </Link>

      <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
        <Chip
          size="small"
          label={`${unit.course.level_name}レベル${unit.course.level_number}`}
          sx={{
            bgcolor: colors.accent[100],
            color: colors.accent[800],
            mb: 1.5,
          }}
        />
        <Typography sx={{ fontWeight: 800, fontSize: 20, mb: 3 }}>
          {unit.unit_name}
        </Typography>

        <Box
          sx={{
            p: 2.5,
            borderRadius: `${radius.sm}px`,
            bgcolor: colors.surface.light,
            mb: 4,
          }}
        >
          <Typography
            sx={{ fontSize: 14, lineHeight: 1.8, color: colors.text.primary }}
          >
            この画面から学習をスタートできます。
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={onStart}
          disabled={isStarting}
        >
          スタート
        </Button>
      </Box>
    </Box>
  );
};
