"use client";

import { apiClient } from "@/libs/http/apiClient";
import { CreateTaskForm } from "@/features/CreateTask/types";
import { TOKEN_KEY } from "@context/AuthContext";

export const useRegisterTask = () => {
  const registerTask = async (task: CreateTaskForm) => {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const postData = {
      task: task,
    };

    return await apiClient.post(`/api/v1/student/tasks`, postData, { headers });
  };

  return { registerTask };
};
