"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  taskId: number;
  unitId: number;
};

type QuestionHistory = {
  question_id: number;
  question_text: string;
  correct_answer: string;
  selected_choice_number: number;
  status: AnswerStatus;
};

type AnswerStatus = "answered" | "unanswered";

export const useGetData = ({ taskId, unitId }: Props) => {
  const [questionHistories, setQuestionHistories] = useState<QuestionHistory[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<QuestionHistory[]>(
        `/api/student/tasks/${taskId}/units/${unitId}/confirmation`,
      )
      .then((res) => setQuestionHistories(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setQuestionHistories([]);
      })
      .finally(() => setLoading(false));
  }, [router, taskId, unitId]);

  return { questionHistories, loading, error };
};
