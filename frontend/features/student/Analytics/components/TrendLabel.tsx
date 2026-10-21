"use client";

import { Box, Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { colors } from "@/app/theme/colors";
import type { Trend, TrendDirection } from "../formatters";

const trendColor = (direction: TrendDirection) => {
  if (direction === "up") return colors.status.success;
  if (direction === "down") return colors.status.error;
  return colors.text.secondary;
};

export const TrendLabel = ({ trend }: { trend: Trend }) => (
  <Box
    data-testid="trend-label"
    data-direction={trend.direction}
    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
  >
    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
      前期間比
    </Typography>
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 13,
        fontWeight: 700,
        color: trendColor(trend.direction),
      }}
    >
      {trend.direction === "up" && <ArrowUpwardIcon sx={{ fontSize: 14 }} />}
      {trend.direction === "down" && (
        <ArrowDownwardIcon sx={{ fontSize: 14 }} />
      )}
      {trend.text}
    </Box>
  </Box>
);
