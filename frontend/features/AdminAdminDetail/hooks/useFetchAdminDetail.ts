"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdminDetail } from "../types";

// 管理者詳細を取得するフック。
// adminId の変更で自動再取得し、更新後などに使う refetch も返す。
// 取得状態は admin（成功）/ fetchError（失敗）で区別する。
export const useFetchAdminDetail = (adminId: number) => {
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAdmin = useCallback(() => {
    setFetchError(null);

    apiClient
      .get<{ admin: AdminDetail }>(`/api/admin/admins/${adminId}`)
      .then((res) => setAdmin(res.data.admin))
      .catch((err) => {
        const { status } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return;
        }

        // 404（存在しない・削除済み）やその他のエラーはエラー状態として表示する
        setFetchError(
          status === 404
            ? "管理者が見つかりませんでした"
            : "管理者の取得に失敗しました",
        );
      });
  }, [adminId, router]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  // PATCH レスポンスなどで取得済みデータを更新するための setter も返す
  return { admin, setAdmin, fetchError, refetch: fetchAdmin };
};
