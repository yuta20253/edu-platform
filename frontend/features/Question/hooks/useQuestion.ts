"use client";

import { apiClient } from "@/libs/http/apiClient";
import { QuestionType } from "@/types/question/question";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  questions: QuestionType[];
  taskId: number;
  unitId: number;
  goalId?: number;
};

export const useQuestion = ({ questions, taskId, unitId, goalId }: Props) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<number[]>([]);
  const [openedHintStep, setOpenedHintStep] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  const isLastQuestion = questions && currentIndex === questions.length - 1;

  const handleNextQuestion = (ids?: number[]) => {
    const targetIds = Array.isArray(ids) ? ids : answeredQuestionIds;

    const answeredQuestionIdsParam = targetIds.join(",");
    const confirmUrl = goalId
      ? `/goals/${goalId}/tasks/${taskId}/units/${unitId}/questions/confirmation?answered_question_ids=${answeredQuestionIdsParam}`
      : `/tasks/${taskId}/units/${unitId}/questions/confirmation?answered_question_ids=${answeredQuestionIdsParam}`;
    if (isLastQuestion) {
      router.push(confirmUrl);
      return;
    }

    setCurrentIndex((prev) => prev + 1);

    setSelectedChoiceId(null);
    setIsCorrect(null);
    setIsAnswered(false);

    setOpenedHintStep(0);
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (choiceId: number) => {
    try {
      setHasError(false);
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

      const updatedIds = answeredQuestionIds.includes(currentQuestion.id)
        ? answeredQuestionIds
        : [...answeredQuestionIds, currentQuestion.id];

      setAnsweredQuestionIds(updatedIds);

      setIsCorrect(res.data.is_correct);
      setIsAnswered(true);

      setOpenedHintStep(0);

      if (isLastQuestion) {
        handleNextQuestion(updatedIds);
      }
    } catch (error) {
      console.error(error);
      setHasError(true);
    }
  };

  const handleSkip = () => {
    handleNextQuestion();
  };

  return {
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
  };
};
