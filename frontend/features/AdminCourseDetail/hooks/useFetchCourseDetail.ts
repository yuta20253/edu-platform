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
    setLoading(true);
    setError(false);

    apiClient
      .get<AdminCourseDetail>(`/api/admin/courses/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseId, router]);

  return { course, loading, error };
};
