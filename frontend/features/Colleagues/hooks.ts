"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TeachersData } from "./types";

export const useColleagues = () => {
  const [data, setData] = useState<TeachersData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };

    setLoading(true);

    apiClient
      .get<TeachersData>("/api/teacher/colleagues", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [page, router]);

  return { data, page, loading, setPage };
};
