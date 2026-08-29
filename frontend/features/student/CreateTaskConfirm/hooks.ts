"use client";

import { apiClient } from "@/libs/http/apiClient";
import { DraftTaskType } from "./useFetchDraftTask";

export const useRegisterTask = () => {
  const registerTask = async (draftTask: DraftTaskType) => {
    const postData = {
      task: {
        goal_id: draftTask.goal_id,
        title: draftTask.title,
        content: draftTask.content,
        priority: draftTask.priority,
        due_date: draftTask.due_date,
        unit_ids: draftTask.units.map((u) => u.id),
      },
    };

    return await apiClient.post(`/api/student/tasks`, postData);
  };

  return { registerTask };
};
