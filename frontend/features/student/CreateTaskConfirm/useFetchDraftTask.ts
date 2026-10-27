"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import type { DraftTaskType } from "./types";

export const useFetchDraftTask = (draftTaskId: number | null) => {
  const [draftTask, setDraftTask] = useState<DraftTaskType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!draftTaskId) return;
    const fetchDraftTask = async () => {
      try {
        setIsLoading(true);

        const res = await apiClient.get(
          `/api/student/draft-tasks/${draftTaskId}`,
        );
        setDraftTask(res.data);

        setIsLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDraftTask();
  }, [draftTaskId, setIsLoading]);

  return { draftTask, isLoading };
};
