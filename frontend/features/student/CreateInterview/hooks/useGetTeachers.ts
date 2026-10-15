"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Teacher } from "../types";

// 申請先として選べる、自分の学級の担当教員一覧
export const useGetTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<{ teachers: Teacher[] }>("/api/student/teachers")
      .then((res) => setTeachers(res.data.teachers))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { teachers, loading, error };
};
