"use client";

import { apiClient } from "@/libs/http/apiClient";
import { DraftTaskType } from "./useFetchDraftTask";

export const useRegisterTask = () => {
  const registerTask = async (draftTask: DraftTaskType) => {
    const postData = {
      task: draftTask,
    };

    return await apiClient.post(`/api/student/tasks`, postData);
  };

  return { registerTask };
};
