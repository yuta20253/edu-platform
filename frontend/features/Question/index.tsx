"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetQuestions } from "./hooks/useGetQuestions";
import { Presenter } from "./Presenter";
import { useQuestion } from "./hooks/useQuestion";

type Props = {
  taskId: number;
  unitId: number;
  goalId?: number;
};

export const Question = ({ goalId, taskId, unitId }: Props) => {
  const { questions, loading, error } = useGetQuestions({ taskId, unitId });
  const {
    currentQuestion,
    currentIndex,
    selectedChoiceId,
    isCorrect,
    isAnswered,
    isLastQuestion,
    openedHintStep,
    hasError,
    setOpenedHintStep,
    handleNextQuestion,
    handleSkip,
    handleAnswer,
  } = useQuestion({ questions, taskId, unitId, goalId });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!questions || error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        データの取得に失敗しました
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        問題が存在しません
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        回答の送信に失敗しました
      </Box>
    );
  }

  return (
    <Presenter
      goalId={goalId}
      taskId={taskId}
      unitId={unitId}
      question={currentQuestion}
      currentIndex={currentIndex}
      totalCount={questions.length}
      selectedChoiceId={selectedChoiceId}
      isCorrect={isCorrect}
      isAnswered={isAnswered}
      isLastQuestion={isLastQuestion}
      openedHintStep={openedHintStep}
      onAnswer={handleAnswer}
      onSkip={handleSkip}
      onNextQuestion={handleNextQuestion}
      onOpenHint={setOpenedHintStep}
      onCloseHint={() => setOpenedHintStep(0)}
    />
  );
};
