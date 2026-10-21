"use client";

import { Box, Typography } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { colors } from "@/app/theme/colors";
import { DashboardCard } from "./DashboardCard";

type Props = {
  streakDays: number;
};

export const StreakCard = ({ streakDays }: Props) => (
  <DashboardCard title="連続学習日数">
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <LocalFireDepartmentIcon
        sx={{ fontSize: 32, color: colors.brand.secondary }}
      />
      <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
        {streakDays}
        <Typography component="span" sx={{ fontSize: 16, fontWeight: 700 }}>
          日
        </Typography>
      </Typography>
    </Box>
    <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>
      期間に関係なく、毎日続けて学習している日数
    </Typography>
  </DashboardCard>
);
