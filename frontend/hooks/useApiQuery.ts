"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";

type Options = {
  params?: Record<string, unknown>;
  // false の間は取得しない(条件が揃うまで待つ場合)。デフォルトは true
  enabled?: boolean;
  // false にすると再取得の開始時と enabled が false に変わったときに
  // 前回の data と error を消す。デフォルトは true
  keepPreviousData?: boolean;
};

// データ取得の状態を data と error だけで表す。loading フラグは持たず、
// 「data がなく error もない」状態をローディングとみなす(AsyncBoundary と組み合わせる)。
// 再取得中(url・params の変更、refetch)は前回の data を残す。ページや絞り込みの
// 切替では望ましい動作だが、url 自体が別の対象に変わる場合(例: /items/1 → /items/2)も
// 新しい data が届くまで前の対象の内容が残る。その場合は呼び出し側で key を変えて
// コンポーネントごと作り直すか、keepPreviousData: false を指定して前の内容を見せないこと。
export const useApiQuery = <T>(url: string, options: Options = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  // 失敗時のレスポンスのステータス。レスポンスがない失敗(ネットワークエラーなど)は undefined
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();
  // params は呼び出し側がリテラルで渡しても再取得が走り続けないよう、値で比較する
  const paramsKey = JSON.stringify(options.params ?? null);
  const { enabled = true, keepPreviousData = true } = options;

  useEffect(() => {
    if (!enabled) {
      // 取得条件が外れたら、前回の結果を見せない指定のときだけ消す
      if (!keepPreviousData) {
        setData(null);
        setError(false);
        setErrorStatus(undefined);
      }
      return;
    }

    const controller = new AbortController();
    const params = JSON.parse(paramsKey) ?? undefined;

    // 再取得の開始時は error だけ消し、data は残す(画面が空にならない)
    setError(false);
    setErrorStatus(undefined);
    if (!keepPreviousData) setData(null);

    apiClient
      .get<T>(url, { params, signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res.data);
      })
      .catch((err) => {
        // 中断されたリクエストの結果は、新しい表示を上書きしないよう無視する
        if (axios.isCancel(err) || controller.signal.aborted) return;
        const { status } = extractApiError(err);
        if (status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setErrorStatus(status);
      });

    return () => controller.abort();
  }, [url, paramsKey, reloadKey, enabled, keepPreviousData, router]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, error, errorStatus, refetch };
};
