'use client'

import { apiClient } from "@/libs/http/apiClient";
import { CreateTaskForm } from "@/types/task/new/form";
import { TOKEN_KEY } from "@context/AuthContext";

export const useRegisterTask = () => {
  const registerTask = async ( task : CreateTaskForm["task"]) => {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    return await apiClient.post(`/api/v1/student/tasks`, { task }, { headers });
  };

  return { registerTask }
};
