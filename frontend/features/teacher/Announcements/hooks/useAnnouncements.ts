"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import {
  AnnouncementsResult,
  AnnouncementTab,
  AuthoredAnnouncementsData,
  ReceivedAnnouncementsData,
} from "../types";

export const useAnnouncements = (tab: AnnouncementTab, page: number) => {
  const [data, setData] = useState<AnnouncementsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    if (tab === "authored") params.tab = "authored";

    // タブやページを素早く切り替えた際、古いリクエストの応答が後から返ってきて
    // 新しい表示を上書きしないようキャンセルする
    const controller = new AbortController();

    setLoading(true);

    apiClient
      .get<ReceivedAnnouncementsData | AuthoredAnnouncementsData>(
        "/api/teacher/announcements",
        { params, signal: controller.signal },
      )
      .then((res) => {
        setData({ tab, data: res.data } as AnnouncementsResult);
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
  }, [tab, page, router]);

  return { data, loading };
};
