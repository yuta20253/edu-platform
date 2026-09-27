"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Goal } from "./types";

export const useGoal = (goalId: number) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Goal>(`/api/student/goals/${goalId}`)
      .then((res) => setGoal(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setGoal(null);
      })
      .finally(() => setLoading(false));
  }, [router, goalId]);

  return { goal, loading, error };
};

type UseDeleteGoalParams = {
  goalId: number;
};

export const useDeleteGoal = ({ goalId }: UseDeleteGoalParams) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const openDeleteDialog = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.delete(`/api/student/goals/${goalId}`);
      router.push("/goals");
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
    deleteDialogOpen,
    deleting,
    deleteError,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
};
