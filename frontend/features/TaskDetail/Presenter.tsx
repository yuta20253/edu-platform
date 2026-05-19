"use client";

import { colors } from "@/app/theme/colors";
import { statusLabel } from "@/constants/tasks";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import { Task } from "./types";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

type Props = {
  task: Task;
  goalId?: number;
};

export const Presenter = ({ task, goalId }: Props) => {
  const statusColor = colors.statusUi[task.status];

  return (
    <Box
      sx={{
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
      >
        タスク詳細
      </Typography>
      <Box
        sx={{
          textAlign: "start",
          mb: 3,
        }}
      >
        {goalId ? (
          <Link href={`/goals/${goalId}`} style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                cursor: "pointer",
                "&:hover": {
                  color: "primary.main",
                },
              }}
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                  <Typography sx={{ fontSize: 14 }}>目標に戻る</Typography>
            </Box>
          </Link>
        ) : (
          <Link href="/tasks" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                cursor: "pointer",
                "&:hover": {
                  color: "primary.main",
                },
              }}
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                  <Typography sx={{ fontSize: 14 }}>
                    タスク一覧に戻る
                  </Typography>
            </Box>
          </Link>
        )}
      </Box>
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "min(720px, 90vw)",
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: 22,
                mb: 2,
                lineHeight: 1.4,
              }}
            >
              {task.title}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                期限：{task.due_date}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  px: 1.2,
                  py: 0.4,
                  borderRadius: 1,
                  bgcolor: statusColor?.bg,
                  color: statusColor?.text,
                  fontWeight: 600,
                }}
              >
                {statusLabel[task.status]}
              </Typography>
            </Box>
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "#f9f9f9",
                minHeight: 120,
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  color: "text.primary",
                }}
              >
                {task.content || "内容はまだ入力されていません。"}
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>単元</Typography>

              {task.units && task.units.length > 0 ? (
                task.units.map((unit) => (
                  <Box
                    key={unit.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {unit.course.level_name}レベル{unit.course.level_number} -{" "}
                      {unit.unit_name}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        component={Link}
                        href=""
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        学習
                      </Button>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#fafafa",
                    color: "text.secondary",
                    fontSize: 14,
                  }}
                >
                  紐づく単元はありません
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
