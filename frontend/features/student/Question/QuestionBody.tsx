"use client";

import { Box } from "@mui/material";
import { QuestionType } from "@/types/question/question";
import { useQuestion } from "./hooks/useQuestion";
import { Presenter } from "./Presenter";

type Props = {
  questions: QuestionType[];
  taskId: number;
  unitId: number;
  goalId?: number;
  studyLogId?: number;
};

// 取得が終わってから描画する。useQuestion の状態は取得後にしか生まれず、
// 失敗 → 再試行 → 成功のときも作り直されて最初の問題から始まる
export const QuestionBody = ({
  questions,
  taskId,
  unitId,
  goalId,
  studyLogId,
}: Props) => {
  const {
    currentQuestion,
    currentIndex,
    selectedChoiceId,
    isCorrect,
    correctChoiceNumber,
    isAnswered,
    isLastQuestion,
    openedHintStep,
    hasError,
    isSubmitting,
    setOpenedHintStep,
    handleNextQuestion,
    handleSkip,
    handleAnswer,
  } = useQuestion({ questions, taskId, unitId, goalId, studyLogId });

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
      correctChoiceNumber={correctChoiceNumber}
      isAnswered={isAnswered}
      isLastQuestion={isLastQuestion}
      openedHintStep={openedHintStep}
      isSubmitting={isSubmitting}
      onAnswer={handleAnswer}
      onSkip={handleSkip}
      onNextQuestion={handleNextQuestion}
      onOpenHint={setOpenedHintStep}
      onCloseHint={() => setOpenedHintStep(0)}
    />
  );
};
