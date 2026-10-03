"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { AnnouncementTargetOptions } from "../types";

export const useAnnouncementTargetOptions = (keyword: string, page: number) => {
  const [data, setData] = useState<AnnouncementTargetOptions | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    if (keyword) params.keyword = keyword;

    // キーワード入力やページ切替を素早く行った際、古いリクエストの応答が
    // 後から返ってきて新しい表示を上書きしないようキャンセルする
    const controller = new AbortController();

    setLoading(true);

    apiClient
      .get<AnnouncementTargetOptions>("/api/teacher/announcements/new", {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [keyword, page, router]);

  return { data, loading };
};
