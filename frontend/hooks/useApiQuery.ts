"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";

type Options = {
  params?: Record<string, unknown>;
};

// データ取得の状態を data と error だけで表す。loading フラグは持たず、
// 「data がなく error もない」状態をローディングとみなす(AsyncBoundary と組み合わせる)。
export const useApiQuery = <T>(url: string, options: Options = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const { params } = options;

  useEffect(() => {
    const controller = new AbortController();

    apiClient
      .get<T>(url, { params, signal: controller.signal })
      .then((res) => setData(res.data))
      .catch(() => setError(true));
  }, [url, params]);

  return { data, error };
};
