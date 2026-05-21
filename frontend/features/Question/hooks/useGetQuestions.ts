"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionType } from "../types";

type Props = {
  taskId: number;
  unitId: number;
};

export const useGetQuestions = ({ taskId, unitId }: Props) => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<QuestionType[]>(
        `/api/student/tasks/${taskId}/units/${unitId}/questions`,
      )
      .then((res) => setQuestions(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  }, [router, taskId, unitId]);

  return { questions, loading, error };
};
