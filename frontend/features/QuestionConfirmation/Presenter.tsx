"use client";

import { Box, Chip, Divider, Typography, Button } from "@mui/material";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { QuestionHistory } from "./types";
import { taskUnitPath } from "@/libs/path/taskUnitPath";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  questionHistories: QuestionHistory[];
};

export const Presenter = ({
  goalId,
  taskId,
  unitId,
  questionHistories,
}: Props) => {
  const answeredCount = questionHistories.filter(
    (history) => history.status === "answered",
  ).length;

  const startRef = taskUnitPath(taskId, unitId, goalId);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 900,
        mx: "auto",
      }}
    >
      <Box sx={{ textAlign: "start", my: 6 }} />
      <Box
        sx={{
          textAlign: "center",
          mb: 5,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 28, md: 36 },
            fontWeight: 700,
            mb: 1,
          }}
        >
          学習結果
        </Typography>

        <Typography
          sx={{
            color: "text.secondary",
            fontSize: 15,
          }}
        >
          {answeredCount} / {questionHistories.length} 問回答
        </Typography>
        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={goalId ? `/goals/${goalId}` : "/tasks"}
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 140, borderRadius: 2, px: 3 }}
            >
              タスク一覧へ
            </Button>
          </Link>

          <Link
            href={startRef}
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="outlined"
              color="primary"
              sx={{ minWidth: 140, borderRadius: 2, px: 3 }}
            >
              もう一度解く
            </Button>
          </Link>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {questionHistories.map((history, index) => {
          const isUnanswered = history.status === "unanswered";

          return (
            <Box
              key={history.question_id}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  問題 {index + 1}
                </Typography>

                {isUnanswered ? (
                  <Chip
                    icon={<HelpOutlineIcon />}
                    label="未回答"
                    color="default"
                    variant="outlined"
                  />
                ) : history.is_correct ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="正解"
                    color="success"
                  />
                ) : (
                  <Chip icon={<CancelIcon />} label="不正解" color="error" />
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.8,
                  mb: 3,
                }}
              >
                {history.question_text}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "text.secondary",
                      mb: 0.5,
                    }}
                  >
                    あなたの回答
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {isUnanswered ? "未回答" : history.selected_choice_number}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "text.secondary",
                      mb: 0.5,
                    }}
                  >
                    正答
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "success.main",
                    }}
                  >
                    {history.correct_answer}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
