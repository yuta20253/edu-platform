"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UpdateAdminInput } from "../types";

type UseUpdateAdminParams = {
  adminId: number;
  // 更新成功後に呼ばれる（詳細の再取得・スナックバー表示など）
  onUpdated: () => void;
};

// 管理者の更新を行うフック。422 はエラーを表示し、401 はログインへ遷移する。
export const useUpdateAdmin = ({
  adminId,
  onUpdated,
}: UseUpdateAdminParams) => {
  const [updating, setUpdating] = useState(false);
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleUpdate = async (input: UpdateAdminInput) => {
    setUpdating(true);
    setUpdateErrors([]);

    try {
      await apiClient.patch(`/api/admin/admins/${adminId}`, input);
      onUpdated();
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
      setUpdateErrors(
        Array.isArray(errors) && errors.length > 0
          ? errors
          : ["管理者の更新に失敗しました"],
      );
    } finally {
      setUpdating(false);
    }
  };

  return { updating, updateErrors, handleUpdate };
};
