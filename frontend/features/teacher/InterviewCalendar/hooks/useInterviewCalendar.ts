"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { getFetchRange, getThisMonth } from "@/libs/calendar/monthGrid";
import { isScheduled } from "../calendarUtils";
import type { InterviewCalendarResponse, ScheduledInterview } from "../types";

export const useInterviewCalendar = () => {
  // 今日と表示月はブラウザでの描画後に決める。サーバー(例: UTC)とブラウザ(JST)で
  // 日付がずれるとハイドレーションエラーになるため、サーバー描画では null のままにする
  const [today, setToday] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();
  // 実行中の取得。月の切り替え・再試行・アンマウント時に前の取得を中断するために持つ
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setToday(new Date());
    setMonth(getThisMonth());
  }, []);

  const fetchInterviews = useCallback(() => {
    if (!month) return;

    // 月を素早く切り替えたときに古いリクエストをキャンセルして、
    // 前の月の遅れたレスポンスで新しい月の結果を上書きしないようにする
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(false);
    // 前の月の面談が新しい月のグリッドに一瞬表示されないようにクリアする
    setInterviews([]);

    apiClient
      .get<InterviewCalendarResponse>("/api/teacher/calendar", {
        params: getFetchRange(month),
        signal: controller.signal,
      })
      .then((res) =>
        setInterviews(res.data.interview_requests.filter(isScheduled)),
      )
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });
  }, [month, router]);

  useEffect(() => {
    fetchInterviews();

    return () => {
      controllerRef.current?.abort();
    };
  }, [fetchInterviews]);

  const goPrevMonth = () =>
    setMonth((current) => current && subMonths(current, 1));
  const goNextMonth = () =>
    setMonth((current) => current && addMonths(current, 1));
  const goThisMonth = () => setMonth(getThisMonth());

  return {
    month,
    today,
    interviews,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
    refetch: fetchInterviews,
  };
};
