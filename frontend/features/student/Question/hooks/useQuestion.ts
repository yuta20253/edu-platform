"use client";

import { apiClient } from "@/libs/http/apiClient";
import { taskUnitPath } from "@/libs/path/taskUnitPath";
import { QuestionType } from "@/types/question/question";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  questions: QuestionType[];
  taskId: number;
  unitId: number;
  goalId?: number;
  studyLogId?: number;
};

export const useQuestion = ({
  questions,
  taskId,
  unitId,
  goalId,
  studyLogId,
}: Props) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(
    new Set(),
  );
  const [openedHintStep, setOpenedHintStep] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isLastQuestion =
    questions.length > 0 && currentIndex === questions.length - 1;

  const currentQuestion = questions[currentIndex];

  const questionStartedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentQuestion?.id]);

  const handleNextQuestion = (ids?: Set<number>) => {
    const targetIds = ids ?? answeredQuestionIds;

    const answeredQuestionIdsParam = Array.from(targetIds).join(",");
    const studyLogIdParam = studyLogId ? `&study_log_id=${studyLogId}` : "";
    const confirmUrl = `${taskUnitPath(taskId, unitId, goalId)}/questions/confirmation?answered_question_ids=${answeredQuestionIdsParam}${studyLogIdParam}`;
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

  const handleAnswer = async (choiceId: number) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setHasError(false);
      setSelectedChoiceId(choiceId);

      const alreadyAnswered =
        currentQuestion.answered || answeredQuestionIds.has(currentQuestion.id);

      const timeSpentSec = Math.max(
        0,
        Math.round((Date.now() - questionStartedAtRef.current) / 1000),
      );

      const payload = {
        task_id: taskId,
        unit_id: unitId,
        question_id: currentQuestion.id,
        question_choice_id: choiceId,
        time_spent_sec: timeSpentSec,
      };

      const res = alreadyAnswered
        ? await apiClient.patch("/api/student/answers", payload)
        : await apiClient.post("/api/student/answers", payload);

      const updatedIds = new Set(answeredQuestionIds);
      updatedIds.add(currentQuestion.id);
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
    } finally {
      setIsSubmitting(false);
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
    isSubmitting,
    setOpenedHintStep,
    handleNextQuestion,
    handleSkip,
    handleAnswer,
  };
};
