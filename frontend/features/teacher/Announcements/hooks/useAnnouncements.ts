"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

    setLoading(true);

    apiClient
      .get<ReceivedAnnouncementsData | AuthoredAnnouncementsData>(
        "/api/teacher/announcements",
        { params },
      )
      .then((res) => {
        setData({ tab, data: res.data } as AnnouncementsResult);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [tab, page, router]);

  return { data, loading };
};
