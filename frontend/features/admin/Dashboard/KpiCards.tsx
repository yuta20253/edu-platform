"use client";

import type { ReactNode } from "react";
import { colors } from "@/app/theme/colors";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { DashboardStats } from "./types";

type Props = {
  stats: DashboardStats;
  activeStudentPeriodDays: number;
};

type KpiCardItem = {
  key: string;
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
  pendingCount?: number;
  tooltip?: string;
};

export const KpiCards = ({ stats, activeStudentPeriodDays }: Props) => {
  const cards: KpiCardItem[] = [
    {
      key: "student",
      label: "生徒数",
      value: stats.student_count,
      icon: <SchoolIcon />,
      color: colors.kpi.blue,
      pendingCount: stats.pending_student_count,
    },
    {
      key: "active_student",
      label: "アクティブ生徒数",
      value: stats.active_student_count,
      icon: <TrendingUpIcon />,
      color: colors.kpi.green,
      tooltip: `過去${activeStudentPeriodDays}日以内に学習記録がある生徒`,
    },
    {
      key: "teacher",
      label: "教師数",
      value: stats.teacher_count,
      icon: <PeopleIcon />,
      color: colors.kpi.purple,
      pendingCount: stats.pending_teacher_count,
    },
    {
      key: "total_questions",
      label: "総問題数",
      value: stats.total_questions,
      icon: <QuizIcon />,
      color: colors.kpi.amber,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 4,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.key}
          elevation={0}
          sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: card.color, width: 44, height: 44 }}>
              {card.icon}
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                {card.tooltip && (
                  <Tooltip title={card.tooltip}>
                    <InfoOutlinedIcon
                      aria-label={card.tooltip}
                      sx={{ color: colors.text.muted, fontSize: 16 }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {card.value}
              </Typography>
              {!!card.pendingCount && (
                <Typography variant="caption" color="text.secondary">
                  招待中 {card.pendingCount}人
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
