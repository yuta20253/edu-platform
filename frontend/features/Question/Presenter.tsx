import { Box, Card, CardContent, Typography } from "@mui/material";

import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { colors } from "@/app/theme/colors";
import { QuestionType } from "@/types/question/question";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  question: QuestionType;
  currentIndex: number;
  totalCount: number;
  selectedChoiceId: number | null;
  isCorrect: boolean | null;
  isAnswered: boolean;
  isLastQuestion: boolean;
  onAnswer: (choiceId: number) => void;
  onSkip: () => void;
  onNextQuestion: () => void;
};

export const Presenter = ({
  goalId,
  taskId,
  unitId,
  question,
  currentIndex,
  totalCount,
  selectedChoiceId,
  isCorrect,
  isAnswered,
  isLastQuestion,
  onAnswer,
  onSkip,
  onNextQuestion,
}: Props) => {
  return (
    <Box
      sx={{
        p: 3,
      }}
    >
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
        <Typography
          sx={{
            fontSize: 14,
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          {currentIndex + 1} / {totalCount}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "min(720px, 90vw)",
            borderRadius: 3,
            boxShadow: 3,
            bgcolor: colors.surface.white,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 18,
                  lineHeight: 1.8,
                  color: colors.text.primary,
                  whiteSpace: "pre-wrap",
                  textAlign: "left",
                }}
              >
                {question.question_text}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {question.question_choices.map((choice) => (
                <Box
                  key={choice.id}
                  onClick={() => {
                    if (!isAnswered) {
                      onAnswer(choice.id);
                    }
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "0.2s",
                    border:
                      isAnswered && choice.id === selectedChoiceId
                        ? isCorrect
                          ? "1px solid #4caf50"
                          : "1px solid #f44336"
                        : `1px solid ${colors.border.default}`,

                    bgcolor:
                      isAnswered && choice.id === selectedChoiceId
                        ? isCorrect
                          ? "#e8f5e9"
                          : "#ffebee"
                        : colors.surface.white,

                    "&:hover": {
                      bgcolor: colors.surface.light,
                    },
                  }}
                >
                  {choice.choice_number}. {choice.choice_text}
                </Box>
              ))}
              {isAnswered && (
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: isCorrect ? "success.main" : "error.main",
                    }}
                  >
                    {isCorrect ? "正解！" : "不正解"}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Link
                href={
                  goalId
                    ? `/goals/${goalId}/tasks/${taskId}/units/${unitId}`
                    : `/tasks/${taskId}/units/${unitId}`
                }
                style={{ textDecoration: "none" }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    border: `1px solid ${colors.border.default}`,
                    color: colors.text.primary,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: colors.surface.light,
                    },
                  }}
                >
                  中断する
                </Box>
              </Link>
              {isAnswered ? (
                <Box
                  onClick={onNextQuestion}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    bgcolor: colors.brand.primary,
                    color: colors.text.inverse,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: colors.brand.primaryHover,
                    },
                  }}
                >
                  {isLastQuestion ? "結果を見る" : "次へ"}
                </Box>
              ) : (
                <Box
                  onClick={onSkip}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    bgcolor: colors.brand.primary,
                    color: colors.text.inverse,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: colors.brand.primaryHover,
                    },
                  }}
                >
                  スキップ
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
