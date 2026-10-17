"use client";

import { colors } from "@/app/theme/colors";
import { alpha, Box } from "@mui/material";
import { formatCorrectRate, getCorrectRateColor } from "./correctRate";

type Props = {
  rate: number | null;
  size?: "small" | "medium";
};

// 正答率を色付きの背景で目立たせる。未解答(null)は背景なしで「-」を出す
export const CorrectRateBadge = ({ rate, size = "medium" }: Props) => {
  const color = getCorrectRateColor(rate);
  const backgroundColor =
    rate === null
      ? "transparent"
      : color === colors.text.primary
        ? colors.surface.light
        : alpha(color, 0.12);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        minWidth: size === "small" ? 52 : 64,
        px: 1,
        py: size === "small" ? 0.25 : 0.5,
        borderRadius: 1.5,
        textAlign: "center",
        fontWeight: 700,
        fontSize: size === "small" ? 13 : 18,
        lineHeight: 1.4,
        color,
        backgroundColor,
      }}
    >
      {formatCorrectRate(rate)}
    </Box>
  );
};
