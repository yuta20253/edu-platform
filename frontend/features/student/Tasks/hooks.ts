"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { TasksData, TaskStatusFilter } from "./types";

export const useGetTasks = () => {
  const [page, setPage] = useState(1);
  const [status, setStatusState] = useState<TaskStatusFilter>("active");

  const params: Record<string, string> = { page: String(page) };
  if (status !== "active") params.status = status;

  const { data, error, refetch } = useApiQuery<TasksData>(
    "/api/student/tasks",
    { params },
  );

  const setStatus = (next: TaskStatusFilter) => {
    setStatusState(next);
    setPage(1);
  };

  return { data, page, setPage, status, setStatus, error, refetch };
};
