"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TeachersData } from "../types";

export const useFetchTeachers = () => {
  const [data, setData] = useState<TeachersData | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchTeachers = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };

    apiClient
      .get<TeachersData>("/api/teacher/teachers", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return { data, page, setPage, refetch: fetchTeachers };
};
