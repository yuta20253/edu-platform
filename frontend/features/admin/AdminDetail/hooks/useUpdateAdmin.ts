"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminDetail, UpdateAdminInput } from "../types";

type UseUpdateAdminParams = {
  adminId: number;
  // 更新成功後に呼ばれる。PATCH レスポンスの最新 admin を渡す。
  onUpdated: (admin: AdminDetail) => void;
};

// 管理者の更新を行うフック。422 はエラーを表示し、401 はログインへ遷移する。
export const useUpdateAdmin = ({
  adminId,
  onUpdated,
}: UseUpdateAdminParams) => {
  const [updating, setUpdating] = useState(false);
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const router = useRouter();

  // 更新に成功したら true を返す（呼び出し側が編集モードを抜けるのに使う）。
  const handleUpdate = async (input: UpdateAdminInput): Promise<boolean> => {
    setUpdating(true);
    setUpdateErrors([]);

    try {
      // PATCH は更新後の admin を返すので、再取得せずそれを使う
      const res = await apiClient.patch<{ admin: AdminDetail }>(
        `/api/admin/admins/${adminId}`,
        input,
      );
      onUpdated(res.data.admin);
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return false;
      }

      setUpdateErrors(errors ?? ["管理者の更新に失敗しました"]);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return { updating, updateErrors, handleUpdate };
};
