"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import type { AdminUnitDetail } from "../types";

export const useFetchUnitDetail = (courseId: number, unitId: number) => {
  const [unit, setUnit] = useState<AdminUnitDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // courseId / unitId が変わった際、古いリクエストをキャンセルして
    // 古い応答で新しい表示を上書きしないようにする
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    apiClient
      .get<AdminUnitDetail>(
        `/api/v1/admin/courses/${courseId}/units/${unitId}`,
        {
          signal: controller.signal,
        },
      )
      .then((res) => {
        setUnit(res.data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setUnit(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [courseId, unitId, router]);

  return { unit, loading, error };
};
