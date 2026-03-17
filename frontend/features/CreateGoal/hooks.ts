"use client";

import { apiClient } from "@/libs/http/apiClient";
import { CreateGoalForm } from "./types";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";

export const useSubmit = () => {
  const router = useRouter();
  const onSubmit: SubmitHandler<CreateGoalForm> = async (data) => {
    try {
      const formattedPostData = {
        ...data,
        due_date: data.due_date
          ? data.due_date.toISOString().split("T")[0]
          : null,
      };

      const res = await apiClient.post("/api/student/goals", {
        goal: formattedPostData,
      });

      const goalId = Number(res.data);

      router.push(`/goals/${goalId}/tasks/new`);
    } catch (error) {
      console.error("目標の作成に失敗しました。");
    }
  };

  return { onSubmit };
};
