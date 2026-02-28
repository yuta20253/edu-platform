"use client";

import { apiClient } from "@/libs/http/apiClient";
import { CreateTaskForm } from "@/features/CreateTask/types";

export const useRegisterTask = () => {
  const registerTask = async (task: CreateTaskForm) => {
    const postData = {
      task: task,
    };

    return await apiClient.post(`/api/v1/student/tasks`, postData);
  };

  return { registerTask };
};
