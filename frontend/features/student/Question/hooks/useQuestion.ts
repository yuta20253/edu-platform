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

      // フロントエンドでの経過時間計測はdevtools等で改竄可能。ただしtime_spent_secは
      // 正誤判定(Student::QuestionAnswerJudgeService)に一切使われない分析用の付随情報であり、
      // 改竄されても採点・進捗解放などには影響しない。サーバー側から「問題を開いた瞬間」を
      // 正確に把握する手段がない(表示から回答までの間にタブ切り替え・離脱もありうる)ため、
      // 厳密な計測をサーバー側に持たせるコストに見合わないと判断し、フロント計測を採用している。
      // バックエンド側はcreate_question_history_form.rbで上限(1時間)のみ検証し、
      // 極端な改竄値によるエラーを防ぐサニティチェックに留めている。
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
