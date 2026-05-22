"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetQuestions } from "./hooks/useGetQuestions";
import { Presenter } from "./Presenter";
import { useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";

type Props = {
  taskId: number;
  unitId: number;
  goalId?: number;
};

export const Question = ({ goalId, taskId, unitId }: Props) => {
  const { questions, loading, error } = useGetQuestions({ taskId, unitId });
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<number[]>([]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const isLastQuestion = questions && currentIndex === questions.length - 1;

  const router = useRouter();

  const handleNextQuestion = () => {
    const confirmUrl = goalId
      ? `/goals/${goalId}/tasks/${taskId}/units/${unitId}/questions/confirmation`
      : `/tasks/${taskId}/units/${unitId}/questions/confirmation`;
    if (isLastQuestion) {
      router.push(confirmUrl);
      return;
    }

    setCurrentIndex((prev) => prev + 1);

    setSelectedChoiceId(null);
    setIsCorrect(null);
    setIsAnswered(false);
  };

  const handleSkip = () => {
    handleNextQuestion();
  };

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

  const currentQuestion = questions[currentIndex];

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

  const handleAnswer = async (choiceId: number) => {
    setSelectedChoiceId(choiceId);

    const alreadyAnswered =
      currentQuestion.answered ||
      answeredQuestionIds.includes(currentQuestion.id);

    const payload = {
      task_id: taskId,
      unit_id: unitId,
      question_id: currentQuestion.id,
      question_choice_id: choiceId,
    };

    const res = alreadyAnswered
      ? await apiClient.patch("/api/student/answers", payload)
      : await apiClient.post("/api/student/answers", payload);

    setAnsweredQuestionIds((prev) =>
      prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id],
    );

    setIsCorrect(res.data.is_correct);
    setIsAnswered(true);
  };

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
      onAnswer={handleAnswer}
      onSkip={handleSkip}
      onNextQuestion={handleNextQuestion}
    />
  );
};
