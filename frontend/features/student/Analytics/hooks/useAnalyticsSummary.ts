"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnalyticsPeriod, periodToSearchParams } from "../period";
import { AnalyticsSummary } from "../types";

const FALLBACK_VALIDATION_MESSAGE = "指定した期間では集計できません";

// 422 を見分けてチップの直下に出す必要があるため、useApiQuery は使わずに取得する。
// 表示の考え方(loading フラグを持たない・401 は /login)は useApiQuery に揃える
export const useAnalyticsSummary = ({ from, to }: AnalyticsPeriod) => {
  // どの期間の結果かを一緒に持ち、期間の切替中(前の期間の結果を表示中)を判定する
  const [result, setResult] = useState<{
    periodKey: string;
    summary: AnalyticsSummary;
  } | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();
  const periodKey = periodToSearchParams({ from, to }).toString();

  useEffect(() => {
    // 期間を続けて切り替えた際、古い応答で新しい期間の結果を上書きしないよう
    // 前のリクエストをキャンセルする
    const controller = new AbortController();
    const params = Object.fromEntries(new URLSearchParams(periodKey));

    setError(false);
    setValidationErrors([]);

    apiClient
      .get<AnalyticsSummary>("/api/student/analytics/summary", {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ periodKey, summary: res.data });
      })
      .catch((err) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        const { status, errors } = extractApiError(err);
        if (status === 401) {
          router.push("/login");
          return;
        }

        // 前の期間のデータを残すと、新しい期間の結果のように見えてしまうため消す
        setResult(null);
        // 期間不正は画面全体をエラーにせず、期間チップの直下にメッセージを出す
        if (status === 422) {
          setValidationErrors(errors ?? [FALLBACK_VALIDATION_MESSAGE]);
          return;
        }
        setError(true);
      });

    return () => controller.abort();
  }, [periodKey, reloadKey, router]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    data: result?.summary ?? null,
    // 新しい期間の結果が届くまで、前の期間の結果を表示している
    refreshing: result !== null && result.periodKey !== periodKey,
    error,
    validationErrors,
    refetch,
  };
};
