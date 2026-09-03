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
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<GradesData>(`/api/admin/schools/${schoolId}/grades`)
      .then((res) => setGrades(res.data.grades))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [schoolId, router]);

  return { grades, loading };
};
