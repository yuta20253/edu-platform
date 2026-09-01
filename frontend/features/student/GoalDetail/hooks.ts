"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Goal } from "./types";

export const useGoal = (goalId: number) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Goal>(`/api/student/goals/${goalId}`)
      .then((res) => setGoal(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setGoal(null);
      })
      .finally(() => setLoading(false));
  }, [router, goalId]);

  return { goal, loading, error };
};
