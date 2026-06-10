"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { AdminCourseDetail } from "../types";

export const useFetchCourseDetail = (courseId: number) => {
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // courseId が変わった際、古いリクエストの応答で新しい表示を上書きしないようにする
    let ignore = false;

    setLoading(true);
    setError(false);

    apiClient
      .get<AdminCourseDetail>(`/api/admin/courses/${courseId}`)
      .then((res) => {
        if (ignore) return;
        setCourse(res.data);
      })
      .catch((err) => {
        if (ignore) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setCourse(null);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [courseId, router]);

  return { course, loading, error };
};
