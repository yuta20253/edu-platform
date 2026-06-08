"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdminDetail } from "../types";

// 管理者詳細を取得するフック。
// adminId の変更で自動再取得し、更新後などに使う refetch も返す。
export const useFetchAdminDetail = (adminId: number) => {
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const router = useRouter();

  const fetchAdmin = useCallback(() => {
    apiClient
      .get<{ admin: AdminDetail }>(`/api/admin/admins/${adminId}`)
      .then((res) => setAdmin(res.data.admin))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [adminId, router]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  return { admin, refetch: fetchAdmin };
};
