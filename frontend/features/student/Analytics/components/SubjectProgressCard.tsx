import { Box, LinearProgress, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { rateTrend } from "../formatters";
import type { SubjectProgress } from "../types";
import { DashboardCard } from "./DashboardCard";
import { TrendLabel } from "./TrendLabel";

type Props = {
  subjectProgress: SubjectProgress[];
};

export const SubjectProgressCard = ({ subjectProgress }: Props) => (
  <DashboardCard title="科目別進捗">
    <Typography sx={{ mb: 1.5, fontSize: 12, color: "text.secondary" }}>
      期間内に解いた問題の正答率
    </Typography>

    {subjectProgress.length === 0 ? (
      <Typography
        sx={{ py: 2, fontSize: 13, color: "text.secondary", textAlign: "center" }}
      >
        この期間に解いた問題はありません
      </Typography>
    ) : (
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {subjectProgress.map(({ subject_name, correct_rate }) => (
          <Box component="li" key={subject_name} aria-label={subject_name}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                columnGap: 1,
                mb: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {subject_name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendLabel
                  trend={rateTrend(correct_rate.current, correct_rate.previous)}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                  {correct_rate.current}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={correct_rate.current}
              sx={{
                height: 8,
                borderRadius: 999,
                backgroundColor: colors.border.subtle,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  backgroundColor: colors.accent[600],
                },
              }}
            />
          </Box>
        ))}
      </Box>
    )}
  </DashboardCard>
);
