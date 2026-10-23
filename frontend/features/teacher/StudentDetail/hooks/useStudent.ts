"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import {
  Student,
  StudentDetailResult,
  StudentDetailTab,
  StudentGoalsData,
  StudentTasksData,
} from "../types";

export const useStudent = (studentId: number) => {
  const [tab, setTab] = useState<StudentDetailTab>("profile");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StudentDetailResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // プロフィールは従来どおりtabを付けずに取得する。pageはタスクタブだけで使う
    const params: Record<string, string> = {};
    if (tab !== "profile") params.tab = tab;
    if (tab === "tasks") params.page = String(page);

    // タブやページを素早く切り替えた際、古いリクエストの応答が後から返ってきて
    // 新しい表示を上書きしないようキャンセルする
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    apiClient
      .get<Student | StudentGoalsData | StudentTasksData>(
        `/api/teacher/students/${studentId}`,
        { params, signal: controller.signal },
      )
      .then((res) => {
        setData({ tab, data: res.data } as StudentDetailResult);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        // タブ切り替え後の失敗でもヘッダーに生徒名を出せるよう、前回のデータは残す
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [router, studentId, tab, page, reloadKey]);

  // ページはタスクタブだけで使うため、タブを変えたら1ページ目に戻す
  const changeTab = (nextTab: StudentDetailTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, tab, page, loading, error, changeTab, setPage, refetch };
};
