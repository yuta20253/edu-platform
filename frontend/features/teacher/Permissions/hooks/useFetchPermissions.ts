"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PermissionsData } from "../types";

export const useFetchPermissions = () => {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchPermissions = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };

    apiClient
      .get<PermissionsData>("/api/teacher/permissions", { params })
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(err);
      });
  }, [page, router]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return { data, page, setPage, error, refetch: fetchPermissions };
};
