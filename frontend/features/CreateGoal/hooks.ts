'use client'

import { apiClient } from "@/libs/http/apiClient";
import { TOKEN_KEY } from "@context/AuthContext";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";

type CreateGoalForm = {
  goal: {
    title: string;
    description: string;
    due_date: string;
  };
};

export const useSubmit = () => {
  const router = useRouter();
  const onSubmit: SubmitHandler<CreateGoalForm> = async (
    data
  ) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await apiClient.post("/api/v1/student/goals", data, {
        headers,
      });

      const goalId = res.data;

      router.push(`/goals/${goalId}/tasks/new`);
    } catch (error) {
      console.error("目標の作成に失敗しました。");
    }
  };

  return { onSubmit };
};
