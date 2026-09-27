"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GoalsData } from "./types";

export const useGetGoals = () => {
  const [data, setData] = useState<GoalsData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const fetchGoals = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };
    setLoading(true);
    setError(false);

    apiClient
      .get<GoalsData>("/api/student/goals", { params })
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

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { data, page, setPage, loading, error, refetch: fetchGoals };
};

type UseDeleteGoalParams = {
  onDeleted: () => void;
};

export const useDeleteGoal = ({ onDeleted }: UseDeleteGoalParams) => {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const openDeleteDialog = (id: number, title: string) => {
    setDeleteError(null);
    setDeleteTarget({ id, title });
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.delete(`/api/student/goals/${deleteTarget.id}`);
      setDeleteTarget(null);
      onDeleted();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setDeleteError(errors?.[0] ?? "目標の削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteTarget,
    deleting,
    deleteError,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
};
