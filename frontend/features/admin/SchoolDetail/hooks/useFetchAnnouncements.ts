"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { Announcement, AnnouncementsData, AnnouncementsMeta } from "../types";

// お知らせ一覧をページネーション付きで取得するフック。
export const useFetchAnnouncements = (schoolId: number) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<AnnouncementsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    apiClient
      .get<AnnouncementsData>(`/api/admin/schools/${schoolId}/announcements`, {
        params: { page: String(page) },
      })
      .then((res) => {
        setAnnouncements(res.data.announcements);
        setMeta(res.data.meta);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [schoolId, page, router]);

  return { announcements, meta, page, setPage, loading };
};
