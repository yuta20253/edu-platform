"use client";

import { colors } from "@/app/theme/colors";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PeopleIcon from "@mui/icons-material/People";
import QuizIcon from "@mui/icons-material/Quiz";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import type { ReactNode } from "react";
import { calcTrend, formatStudyMinutes, type Trend } from "./formatters";
import type { AnalyticsKpis, KpiValue } from "./types";

type Props = {
  kpis: AnalyticsKpis;
};

const ACTIVE_STUDENT_DEFINITION =
  "期間内に解答または学習記録がある生徒（ログイン履歴は記録していません）";

type KpiCard = {
  label: string;
  value: KpiValue;
  format: (value: number) => string;
  icon: ReactNode;
  color: string;
  // ラベル横の info アイコンに出す定義文
  definition?: string;
};

const buildCards = (kpis: AnalyticsKpis): KpiCard[] => [
  {
    label: "アクティブ生徒数",
    value: kpis.active_student_count,
    format: (value) => value.toLocaleString("ja-JP"),
    icon: <PeopleIcon />,
    color: colors.kpi.blue,
    definition: ACTIVE_STUDENT_DEFINITION,
  },
  {
    label: "総解答数",
    value: kpis.answer_count,
    format: (value) => value.toLocaleString("ja-JP"),
    icon: <QuizIcon />,
    color: colors.kpi.purple,
  },
  {
    label: "全体正答率",
    value: kpis.accuracy_rate,
    format: (value) => `${value}%`,
    icon: <CheckCircleOutlineIcon />,
    color: colors.kpi.green,
  },
  {
    label: "総学習時間",
    value: kpis.study_minutes,
    format: formatStudyMinutes,
    icon: <TimerOutlinedIcon />,
    color: colors.kpi.amber,
  },
];

const trendColor = (direction: Trend["direction"]) => {
  if (direction === "up") return colors.status.success;
  if (direction === "down") return colors.status.error;
  return colors.text.secondary;
};

const trendText = ({ direction, percent }: Trend) => {
  if (direction === "flat") return "±0%";
  if (percent === null) return "前期間なし";
  return `${percent}%`;
};

const TrendLabel = ({ trend }: { trend: Trend }) => (
  <Box
    data-testid="kpi-trend"
    data-direction={trend.direction}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.25,
      color: trendColor(trend.direction),
    }}
  >
    {trend.direction === "up" && <ArrowUpwardIcon sx={{ fontSize: 16 }} />}
    {trend.direction === "down" && <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
    <Typography variant="caption" fontWeight={600} component="span">
      {trendText(trend)}
    </Typography>
  </Box>
);

export const KpiCards = ({ kpis }: Props) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        md: "repeat(4, 1fr)",
      },
      gap: 2,
      mb: 3,
    }}
  >
    {buildCards(kpis).map((card) => (
      <Card
        key={card.label}
        role="group"
        aria-label={card.label}
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
              {card.definition && (
                <Tooltip title={card.definition} arrow>
                  <InfoOutlinedIcon
                    sx={{ fontSize: 16, color: colors.text.muted }}
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {card.format(card.value.current)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="caption" color="text.secondary">
                前期間比
              </Typography>
              <TrendLabel trend={calcTrend(card.value)} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);
