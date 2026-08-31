"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useCallback, useEffect, useState } from "react";
import { Task } from "../types";
import { useRouter } from "next/navigation";
import { extractApiError } from "@/libs/http/extractApiError";

export const useFetchTask = (taskId: number) => {
  const [task, setTask] = useState<Task | null>(null);
  const router = useRouter();
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTask = useCallback(() => {
    setFetchError(null);

    apiClient
      .get(`/api/student/tasks/${taskId}`)
      .then((res) => setTask(res.data))
      .catch((err) => {
        const { status } = extractApiError(err);
        if (status === 401) {
          router.push("/login");
          return;
        }

        setFetchError(
          status === 404
            ? "タスクが見つかりませんでした"
            : "タスクの取得に失敗しました",
        );
      });
  }, [router, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return { task, fetchError, refetch: fetchTask };
};
