"use client";

import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CreateTaskForm, Props } from "../types";
import { apiClient } from "@/libs/http/apiClient";

export const useSubmit = ({ selectedUnitIds }: Props) => {
  const router = useRouter();
  const onSubmit: SubmitHandler<CreateTaskForm> = async (data) => {
    const formattedPostData = {
      ...data,
      unit_ids: selectedUnitIds,
    };

    const res = await apiClient.post(
      "/api/student/draft-tasks",
      { draft_task: formattedPostData },
    )

    const draftTaskId = Number(res.data);

    router.push(`/goals/${data.goal_id}/tasks/confirm?draft_task_id=${draftTaskId}`);
  };

  return { onSubmit };
};
