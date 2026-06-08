"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UseDeleteAdminParams = {
  adminId: number;
};

// 管理者の削除を行うフック。
// 確認ダイアログの開閉・削除中状態・エラー（自己削除/最後の管理者など）を管理する。
// 削除成功後は一覧（/admin/admins）へ遷移する。
export const useDeleteAdmin = ({ adminId }: UseDeleteAdminParams) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleDeleteClick = () => {
    setDeleteErrors([]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteErrors([]);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteErrors([]);

    try {
      await apiClient.delete(`/api/admin/admins/${adminId}`);
      router.push("/admin/admins");
    } catch (err) {
      const response =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { status?: number; data?: { errors?: string[] } };
              }
            ).response
          : undefined;

      if (response?.status === 401) {
        router.push("/login");
        return;
      }

      const errors = response?.data?.errors;
      setDeleteErrors(
        Array.isArray(errors) && errors.length > 0
          ? errors
          : ["管理者の削除に失敗しました"],
      );
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteDialogOpen,
    deleting,
    deleteErrors,
    handleDeleteClick,
    handleDeleteDialogClose,
    handleDeleteConfirm,
  };
};
