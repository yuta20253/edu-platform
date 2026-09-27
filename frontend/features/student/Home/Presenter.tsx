"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { statusLabel } from "@/constants/status";
import { GoalType } from "@/libs/server/studentDashboard";
import { GoalStatus } from "@/types/goals/status";
import { Box, Button, Chip, IconButton, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Link from "next/link";
import { JSX, useMemo } from "react";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

export const Presenter = ({
  initialGoals,
}: {
  initialGoals: GoalType[];
}): JSX.Element => {
  const goals = useMemo(() => initialGoals ?? [], [initialGoals]);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        今日もはじめよう
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 800 }}>
          目標
        </Typography>
        <Link href="/goals" style={{ fontSize: 12, color: colors.accent[600] }}>
          目標一覧
        </Link>
      </Box>

      {goals.length === 0 ? (
        <Box
          sx={{
            ...cardSx,
            p: 3,
            textAlign: "center",
            fontSize: 13,
            color: "text.secondary",
          }}
        >
          目標がまだありません
        </Box>
      ) : (
        goals.map((goal) => {
          const status = goal.status as GoalStatus;
          const statusColor = colors.statusUi[status];

          return (
            <Box
              key={goal.id}
              sx={{
                ...cardSx,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.75,
                mb: 1.25,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Chip
                  size="small"
                  label={statusLabel[status]}
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
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
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
              <IconButton
                component={Link}
                href={`/goals/${goal.id}/edit`}
                aria-label="編集"
                size="small"
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })
      )}

      <Button
        component={Link}
        href="/goals/new"
        variant="contained"
        fullWidth
        startIcon={<AddIcon />}
        sx={{ mt: 0.5, py: 1.25 }}
      >
        目標追加
      </Button>

      <Box sx={{ mt: 4 }}>
        <Box
          component={Link}
          href="/analytics"
          sx={{
            ...cardSx,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1.75,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          学習分析
          <ChevronRightIcon fontSize="small" />
        </Box>
      </Box>
    </Box>
  );
};
