"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { Task } from "./types";

export const useGetTask = (taskId: number) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Task>(`/api/student/tasks/${taskId}`)
      .then((res) => setTask(res.data))
      .catch((err) => {
        console.log(err.message);
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setLoading(false);
        setTask(null);
      })
      .finally(() => setLoading(false));
  }, [router, taskId]);

  return { task, loading, error };
};
