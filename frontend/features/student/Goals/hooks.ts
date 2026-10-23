"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoalsData } from "./types";

export const useGetGoals = () => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<GoalsData>(
    "/api/student/goals",
    { params: { page: String(page) } },
  );

  return { data, page, setPage, error, refetch };
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
