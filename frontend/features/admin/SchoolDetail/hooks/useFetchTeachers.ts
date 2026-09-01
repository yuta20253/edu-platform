"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { Teacher, TeachersData } from "../types";

// 教師一覧を取得するフック。追加/編集後の再取得用にrefetchも返す。
export const useFetchTeachers = (schoolId: number) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTeachers = useCallback(() => {
    setLoading(true);

    apiClient
      .get<TeachersData>(`/api/admin/schools/${schoolId}/teachers`)
      .then((res) => setTeachers(res.data.teachers))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [schoolId, router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return { teachers, loading, refetch: fetchTeachers };
};
