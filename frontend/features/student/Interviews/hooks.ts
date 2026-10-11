"use client";

import { apiClient } from "@/libs/http/apiClient";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InterviewsData, InterviewStatusFilter } from "./types";

export const useGetInterviews = () => {
  const [data, setData] = useState<InterviewsData | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatusState] = useState<InterviewStatusFilter>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // 絞り込みやページが切り替わった際、古いリクエストをキャンセルして
    // 古い応答で新しい結果を上書きしないようにする
    const controller = new AbortController();

    const params: Record<string, string> = { page: String(page) };
    if (status !== "all") params.status = status;

    setLoading(true);
    setError(false);

    apiClient
      .get<InterviewsData>("/api/student/interview-requests", {
        params,
        signal: controller.signal,
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setData(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [page, status, router]);

  const setStatus = (next: InterviewStatusFilter) => {
    setStatusState(next);
    setPage(1);
  };

  return { data, page, setPage, status, setStatus, loading, error };
};
