import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";

import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { QuestionType } from "@/types/question/question";
import { taskUnitPath } from "@/libs/path/taskUnitPath";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

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
  openedHintStep: number;
  isSubmitting: boolean;
  onAnswer: (choiceId: number) => void;
  onSkip: () => void;
  onNextQuestion: () => void;
  onOpenHint: (hintNum: number) => void;
  onCloseHint: () => void;
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
  openedHintStep,
  isSubmitting,
  onAnswer,
  onSkip,
  onNextQuestion,
  onOpenHint,
  onCloseHint,
}: Props) => {
  const startRef = taskUnitPath(taskId, unitId, goalId);

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
        <Link href={startRef} style={{ textDecoration: "none" }}>
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
            <Typography sx={{ fontSize: 14 }}>中断する</Typography>
          </Box>
        </Link>
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
            ...cardSx,
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
              {question.question_choices.map((choice) => {
                const isSelected = isAnswered && choice.id === selectedChoiceId;

                return (
                  <Button
                    key={choice.id}
                    fullWidth
                    disabled={isSubmitting || isAnswered}
                    onClick={() => onAnswer(choice.id)}
                    sx={{
                      justifyContent: "space-between",
                      textTransform: "none",
                      textAlign: "left",
                      p: 2,
                      color: colors.text.primary,
                      border: `1px solid ${
                        isSelected
                          ? isCorrect
                            ? colors.statusAnswer.correctBorder
                            : colors.statusAnswer.incorrectBorder
                          : colors.border.default
                      }`,
                      bgcolor: isSelected
                        ? isCorrect
                          ? colors.statusAnswer.correctBg
                          : colors.statusAnswer.incorrectBg
                        : "transparent",
                      "&:hover": {
                        bgcolor: isAnswered ? undefined : colors.surface.light,
                      },
                      "&.Mui-disabled": {
                        color: colors.text.primary,
                        borderColor: isSelected
                          ? isCorrect
                            ? colors.statusAnswer.correctBorder
                            : colors.statusAnswer.incorrectBorder
                          : colors.border.default,
                      },
                    }}
                  >
                    <span>
                      {choice.choice_number}. {choice.choice_text}
                    </span>
                    {isSelected && (
                      <Chip
                        size="small"
                        icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                        label={isCorrect ? "正解" : "不正解"}
                        color={isCorrect ? "success" : "error"}
                        sx={{ ml: 1, flex: "none" }}
                      />
                    )}
                  </Button>
                );
              })}
              <Box sx={{ mt: 3 }}>
                {question.question_hints.map((hint) => (
                  <Box key={hint.id} sx={{ mb: 2 }}>
                    {openedHintStep !== hint.step_number ? (
                      <Box
                        onClick={() => onOpenHint(hint.step_number)}
                        sx={{
                          display: "inline-block",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: colors.surface.light,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        ヒント {hint.step_number} を見る
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: colors.surface.light,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            ヒント {hint.step_number}
                          </Typography>

                          <Box
                            onClick={onCloseHint}
                            sx={{
                              fontSize: 13,
                              color: "text.secondary",
                              cursor: "pointer",
                              "&:hover": {
                                opacity: 0.7,
                              },
                            }}
                          >
                            閉じる
                          </Box>
                        </Box>

                        <Typography
                          sx={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.8,
                          }}
                        >
                          {hint.hint_text}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {isAnswered ? (
                <Button
                  variant="contained"
                  onClick={() => onNextQuestion()}
                  sx={{ px: 3 }}
                >
                  {isLastQuestion ? "結果を見る" : "次へ"}
                </Button>
              ) : (
                <Button variant="outlined" onClick={onSkip} sx={{ px: 3 }}>
                  スキップ
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
