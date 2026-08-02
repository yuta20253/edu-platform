"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { ColleagueInvitationsData } from "../types";

export const useColleagueInvitations = () => {
  const [data, setData] = useState<ColleagueInvitationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<ColleagueInvitationsData>(
        "/api/teacher/teacher_notifications",
      );
      setData(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        router.push("/login");
        return;
      }
      setError(
        "未招待の教員一覧の取得に失敗しました。ページを再読み込みしてください。",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { data, loading, error, refetch: fetchInvitations };
};
