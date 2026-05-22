"use client";

import { Box, Typography } from "@mui/material";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  questionHistories: QuestionHistory[];
};

type QuestionHistory = {
  question_id: number;
  question_text: string;
  correct_answer: string;
  selected_choice_number: number;
  status: AnswerStatus;
};

type AnswerStatus = "answered" | "unanswered";

export const Presenter = ({
  goalId,
  taskId,
  unitId,
  questionHistories,
}: Props) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          textAlign: "start",
          my: 6,
        }}
      >
        {goalId ? (
          <Link
            href={`/goals/${goalId}/tasks/${taskId}/units/${unitId}`}
            style={{ textDecoration: "none" }}
          >
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
              <Typography sx={{ fontSize: 14 }}>スタート画面へ</Typography>
            </Box>
          </Link>
        ) : (
          <Link
            href={`/tasks/${taskId}/units/${unitId}`}
            style={{ textDecoration: "none" }}
          >
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
              <Typography sx={{ fontSize: 14 }}>スタート画面へ</Typography>
            </Box>
          </Link>
        )}
      </Box>
      <Box
        sx={{
          mb: 2,
          textAlign: "center",
        }}
      >
        <Typography>結果</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 4,
          }}
        >
          {questionHistories.map((history, index) => (
            <Box
              key={history.question_id}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                問題 {index + 1}
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.7,
                }}
              >
                {history.question_text}
              </Typography>

              <Typography>
                あなたの回答:
                {history.status === "unanswered"
                  ? " 未回答"
                  : ` ${history.selected_choice_number}`}
              </Typography>

              <Typography>正答: {history.correct_answer}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
