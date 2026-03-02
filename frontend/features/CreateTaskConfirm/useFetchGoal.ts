"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { GoalType } from "./types";

export const useFetchGoal = (goalId: number) => {
  const [goal, setGoal] = useState<GoalType | null>(null);

  useEffect(() => {
    if (!goalId) return;
    const fetchGoal = async () => {
      try {
        const res = await apiClient.get(`/api/student/goals/${goalId}`);

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
