"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";

type Options = {
  params?: Record<string, unknown>;
};

// データ取得の状態を data と error だけで表す。loading フラグは持たず、
// 「data がなく error もない」状態をローディングとみなす(AsyncBoundary と組み合わせる)。
export const useApiQuery = <T>(url: string, options: Options = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();
  // params は呼び出し側がリテラルで渡しても再取得が走り続けないよう、値で比較する
  const paramsKey = JSON.stringify(options.params ?? null);

  useEffect(() => {
    const controller = new AbortController();
    const params = JSON.parse(paramsKey) ?? undefined;

    // 再取得の開始時は error だけ消し、data は残す(画面が空にならない)
    setError(false);

    apiClient
      .get<T>(url, { params, signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res.data);
      })
      .catch((err) => {
        // 中断されたリクエストの結果は、新しい表示を上書きしないよう無視する
        if (axios.isCancel(err) || controller.signal.aborted) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
      });

    return () => controller.abort();
  }, [url, paramsKey, router]);

  return { data, error };
};
