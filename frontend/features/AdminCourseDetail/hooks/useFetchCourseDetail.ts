"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import type { AdminCourseDetail } from "../types";

export const useFetchCourseDetail = (courseId: number) => {
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // courseId が変わった際、古いリクエストをキャンセルして
    // 古い応答で新しい表示を上書きしないようにする
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    apiClient
      .get<AdminCourseDetail>(`/api/admin/courses/${courseId}`, {
        signal: controller.signal,
      })
      .then((res) => {
        setCourse(res.data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setCourse(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [courseId, router]);

  return { course, loading, error };
};
