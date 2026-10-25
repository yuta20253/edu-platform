"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { UnitDetail } from "../types";

export const useFetchUnitDetail = (courseId: number, unitId: number) => {
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // courseId / unitId が変わった際、古いリクエストをキャンセルして
    // 古い応答で新しい表示を上書きしないようにする
    const controller = new AbortController();

    setError(false);

    apiClient
      .get<UnitDetail>(`/api/v1/admin/courses/${courseId}/units/${unitId}`, {
        signal: controller.signal,
      })
      .then((res) => {
        setUnit(res.data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setUnit(null);
      });

    return () => {
      controller.abort();
    };
  }, [courseId, unitId, router, reloadKey]);

  const retry = () => setReloadKey((prev) => prev + 1);

  return { unit, error, retry };
};
