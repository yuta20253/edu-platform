"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TeacherPermissionsData } from "../types";

export const useFetchTeacherPermissions = () => {
  const [data, setData] = useState<TeacherPermissionsData | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchTeacherPermissions = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };

    apiClient
      .get<TeacherPermissionsData>("/api/teacher/permissions", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, router]);

  useEffect(() => {
    fetchTeacherPermissions();
  }, [fetchTeacherPermissions]);

  return { data, page, setPage, refetch: fetchTeacherPermissions };
};
