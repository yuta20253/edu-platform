"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { Goal } from "../types";

export const useFetchGoal = (goalId: number) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    setError(false);

    apiClient
      .get<Goal>(`/api/student/goals/${goalId}`)
      .then((res) => setGoal(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setIsLoading(false);
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [goalId, router]);

  return {
    goal,
    error,
    loading,
  };
};
