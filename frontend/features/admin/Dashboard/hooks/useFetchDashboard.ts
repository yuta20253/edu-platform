"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { DashboardData } from "../types";

// ダッシュボードデータを取得するフック。
// loading/data/errorで状態を区別し、401はログイン画面へリダイレクトする。
// それ以外のエラーはerrorにメッセージをセットし、呼び出し側で
// 「再読み込み」ボタンからrefetchできるようにする。
export const useFetchDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<DashboardData>("/api/admin/dashboard");
      setData(res.data);
    } catch (err: unknown) {
      const { status } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setError("ダッシュボードの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
