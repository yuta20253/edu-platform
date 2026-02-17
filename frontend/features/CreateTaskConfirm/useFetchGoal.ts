"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { TOKEN_KEY } from "@context/AuthContext";
import { GoalType } from "./types";

export const useFetchGoal = (goalId: number) => {
  const [goal, setGoal] = useState<GoalType | null>(null);

  useEffect(() => {
    if (!goalId) return;
    const fetchGoal = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await apiClient.get(`/api/v1/student/goals/${goalId}`, {
          headers,
        });

        setGoal(res.data);
        console.log(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGoal();
  }, [goalId]);

  return { goal };
};
