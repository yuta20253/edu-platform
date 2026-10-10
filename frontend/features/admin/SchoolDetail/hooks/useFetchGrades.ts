"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { Grade, GradesData } from "../types";

// 学年一覧を取得するフック（学年・クラスタブ、教師ドロワーの担当学年選択で使う）。
export const useFetchGrades = (schoolId: number) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiClient
      .get<GradesData>(`/api/admin/schools/${schoolId}/grades`)
      .then((res) => setGrades(res.data.grades))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [schoolId, router, reloadKey]);

  const refetch = () => setReloadKey((prev) => prev + 1);

  return { grades, loading, error, refetch };
};
