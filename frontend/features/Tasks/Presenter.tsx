"use client";

import { colors } from "@/app/theme/colors";
import { statusLabel } from "@/constants/tasks";
import { Box, Card, CardContent, Pagination, Typography } from "@mui/material";
import Link from "next/link";

type Status = "not_started" | "in_progress" | "completed";

type Task = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  due_date: string;
  priority: string;
  status: Status;
  completed_at: string;
};

type TaskMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

type TasksData = {
  tasks: Task[];
  meta: TaskMeta;
};

type Props = {
  data: TasksData;
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data, page, onPageChange }: Props) => {
  const { tasks, meta } = data;

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 900,
        mx: "auto",
      }}
    >
      <Typography
        variant="h4"
        component="p"
        sx={{
          fontWeight: "bold",
          mt: 2,
          mb: 4,
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        タスク一覧
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {!tasks || tasks.length === 0 ? (
          <Typography
            sx={{
              py: 6,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            タスクが見つかりません
          </Typography>
        ) : (
          <>
            {tasks.map((task) => {
              const statusColor = colors.statusUi[task.status];

              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <Card
                    sx={{
                      width: "min(720px, 90vw)",
                      borderRadius: 3,
                      boxShadow: 2,
                      overflow: "hidden",
                      transition: "0.2s",
                      m: 1,
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        p: 2.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          fontSize: 18,
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
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                          }}
                        >
                          期限：{task.due_date}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 12,
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            fontWeight: 600,
                          }}
                        >
                          {statusLabel[task.status]}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {meta.total_pages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 3,
                }}
              >
                <Pagination
                  count={meta.total_pages}
                  page={page}
                  onChange={(_, value) => onPageChange(value)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
