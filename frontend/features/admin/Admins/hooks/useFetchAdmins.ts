"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdminsData } from "../types";

type UseFetchAdminsParams = {
  page: number;
  query: string;
};

// 管理者一覧を取得するフック。
// page / query の変更で自動再取得し、作成後などに使う refetch も返す。
export const useFetchAdmins = ({ page, query }: UseFetchAdminsParams) => {
  const [data, setData] = useState<AdminsData | null>(null);
  const router = useRouter();

  const fetchAdmins = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };
    if (query) {
      params.q = query;
    }

    apiClient
      .get<AdminsData>("/api/admin/admins", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, query, router]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return { data, refetch: fetchAdmins };
};
