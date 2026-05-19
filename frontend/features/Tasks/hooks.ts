"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TasksData } from "./types";

export const useGetTasks = () => {
  const [data, setData] = useState<TasksData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    setLoading(true);
    setError(false);

    apiClient
      .get<TasksData>("/api/student/tasks", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [page, router]);

  return { data, page, setPage, loading, error };
};
