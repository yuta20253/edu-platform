import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from "@mui/material";
import Link from "next/link";
import type { Goal } from "./types";

type GoalStatus = "not_started" | "in_progress" | "completed";

type Props = {
  data: Goal[];
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data }: Props) => {
  const goals = data;

  const statusLabel: Record<GoalStatus, string> = {
    not_started: "未着手",
    in_progress: "進行中",
    completed: "完了",
  };

  const calcProgress = (tasks: Goal["tasks"] = []) => {
    if (tasks.length === 0) return 0;
    const score = tasks.reduce((sum, task) => {
      if (task.status === "completed") return sum + 1;
      if (task.status === "in_progress") return sum + 0.5;
      return sum;
    }, 0);
    return Math.round((score / tasks.length) * 100);
  };

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
                            bgcolor:
                              goal.status === "completed"
                                ? "#e8f5e9"
                                : goal.status === "in_progress"
                                  ? "#e3f2fd"
                                  : "#f5f5f5",
                            color:
                              goal.status === "completed"
                                ? "#2e7d32"
                                : goal.status === "in_progress"
                                  ? "#1565c0"
                                  : "#616161",
                            width: "fit-content",
                          }}
                        >
                          {statusLabel[goal.status as keyof typeof statusLabel]}
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
                              backgroundColor: "#eee",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  progress === 100
                                    ? "#2e7d32"
                                    : progress > 50
                                      ? "#1565c0"
                                      : "#9e9e9e",
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
