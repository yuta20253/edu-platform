"use client";

import { colors } from "@/app/theme/colors";
import { Box, LinearProgress, Typography } from "@mui/material";

type Props = {
  value: number;
  label: string;
};

// 正答率・アクティブ率など百分率をバー付きで表示する。
// 値そのものは表示し、バーだけ 0〜100 に丸める。
export const RateBar = ({ value, label }: Props) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}>
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      aria-label={label}
      sx={{
        flex: 1,
        height: 8,
        borderRadius: 4,
        bgcolor: colors.border.light,
        "& .MuiLinearProgress-bar": { bgcolor: colors.brand.primary },
      }}
    />
    <Typography variant="body2" sx={{ minWidth: 44, textAlign: "right" }}>
      {value}%
    </Typography>
  </Box>
);
