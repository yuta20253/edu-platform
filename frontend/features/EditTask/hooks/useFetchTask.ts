"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { useRouter } from "next/navigation";

export const useFetchTask = (taskId: number) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get(`/api/student/tasks/${taskId}`)
      .then((res) => setTask(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setLoading(false);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [router, taskId]);

  return { task, loading, error };
};
