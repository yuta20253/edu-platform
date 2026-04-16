import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from "@mui/material";
import Link from "next/link";
import type { Goal } from "./types";
import { calcProgress } from "./utils/calcProgress";
import { colors } from "@/app/theme/colors";
import { GoalStatus } from "@/types/goals/goals";
import { statusLabel } from "@/constants/goals";

type Props = {
  data: Goal[];
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data }: Props) => {
  const goals = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
        >
          目標一覧
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center">
          {!goals || goals.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center" }}>
              目標が見つかりません
            </Typography>
          ) : (
            goals.map((goal) => {
              const progress = calcProgress(goal.tasks);
              const statusColor = colors.statusUi[goal.status as GoalStatus];
              const progressColor =
                progress === 100
                  ? colors.progress.completed
                  : progress > 50
                    ? colors.progress.in_progress
                    : colors.progress.not_started;

              return (
                <Card
                  key={goal.id}
                  component={Link}
                  href={`/goals/${goal.id}`}
                  sx={{
                    width: "min(720px, 90vw)",
                    textDecoration: "none",
                    borderRadius: 3,
                    boxShadow: 2,
                    overflow: "hidden",
                    ":hover": { boxShadow: 4 },
                    m: 1,
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      p: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
                      {goal.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 12, color: "text.secondary" }}
                        >
                          期限: {goal.due_date}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            width: "fit-content",
                          }}
                        >
                          {statusLabel[goal.status as GoalStatus]}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: colors.border.subtle,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: progressColor,
                              },
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: 12, minWidth: 40 }}>
                          進捗率:{progress}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};
