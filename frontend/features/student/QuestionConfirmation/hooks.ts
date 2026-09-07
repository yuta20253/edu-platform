"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QuestionHistory } from "./types";

type Props = {
  taskId: number;
  unitId: number;
  answeredQuestionIds?: number[];
};

export const useGetQuestionConfirmation = ({
  taskId,
  unitId,
  answeredQuestionIds,
}: Props) => {
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
        {
          params: {
            answered_question_ids: answeredQuestionIds?.join(","),
          },
        },
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
  }, [router, taskId, unitId, answeredQuestionIds]);

  return { questionHistories, loading, error };
};

type CompleteStudyLogProps = {
  taskId: number;
  unitId: number;
  studyLogId?: number;
};

export const useCompleteStudyLog = ({
  taskId,
  unitId,
  studyLogId,
}: CompleteStudyLogProps) => {
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!studyLogId || completedRef.current) return;

    completedRef.current = true;

    apiClient
      .patch(
        `/api/student/tasks/${taskId}/units/${unitId}/study_logs/${studyLogId}`,
      )
      .catch((error) => {
        console.error(error);
      });
  }, [taskId, unitId, studyLogId]);
};
