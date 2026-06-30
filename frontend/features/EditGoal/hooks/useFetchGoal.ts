"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { Goal } from "../types";
import { extractApiError } from "@/libs/http/extractApiError";

export const useFetchGoal = (goalId: number) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  const fetchGoal = useCallback(() => {
    setFetchError(null);

    apiClient
      .get<Goal>(`/api/student/goals/${goalId}`)
      .then((res) => setGoal(res.data))
      .catch((err) => {
        const { status } = extractApiError(err);
        if (status === 401) {
          router.push("/login");
          return;
        }

        setFetchError(
          status === 404
            ? "目標が見つかりませんでした"
            : "目標の取得に失敗しました",
        );
      });
  }, [goalId, router]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return {
    goal,
    fetchError,
    refetch: fetchGoal,
  };
};
