"use client";

import { apiClient } from "@/libs/http/apiClient";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsPeriod, periodToSearchParams } from "../period";
import { AnalyticsSummary } from "../types";

const FALLBACK_VALIDATION_MESSAGE = "指定した期間では集計できません";

const validationMessages = (err: unknown): string[] => {
  const errors = (err as { response?: { data?: { errors?: unknown } } })
    .response?.data?.errors;
  return Array.isArray(errors) && errors.length > 0
    ? errors.map(String)
    : [FALLBACK_VALIDATION_MESSAGE];
};

export const useAnalyticsSummary = ({ from, to }: AnalyticsPeriod) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 期間を続けて切り替えた際、古い応答で新しい期間の結果を上書きしないよう
    // 前のリクエストをキャンセルする
    const controller = new AbortController();
    const params = Object.fromEntries(periodToSearchParams({ from, to }));

    setLoading(true);
    setError(false);

    apiClient
      .get<AnalyticsSummary>("/api/student/analytics/summary", {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        if (controller.signal.aborted) return;
        setSummary(res.data);
        setValidationErrors([]);
      })
      .catch((err) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        const status = err.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }

        // 前の期間のデータを残すと、新しい期間の結果のように見えてしまうため消す
        setSummary(null);
        // 期間不正は画面全体をエラーにせず、期間チップの直下にメッセージを出す
        if (status === 422) {
          setValidationErrors(validationMessages(err));
          return;
        }
        setValidationErrors([]);
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [from, to, router]);

  return { summary, loading, error, validationErrors };
};
