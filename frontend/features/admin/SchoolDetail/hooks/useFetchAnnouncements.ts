"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { PaginationMeta } from "@/types/common/pagination";
import type { Announcement, AnnouncementsData } from "../types";

// お知らせ一覧をページネーション付きで取得するフック。
export const useFetchAnnouncements = (schoolId: number) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // ページ変更が連続した場合に、古いリクエストの応答が後から返ってきて
    // 新しいページの表示を上書きしないようキャンセルする
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    apiClient
      .get<AnnouncementsData>(`/api/admin/schools/${schoolId}/announcements`, {
        params: { page: String(page) },
        signal: controller.signal,
      })
      .then((res) => {
        setAnnouncements(res.data.announcements);
        setMeta(res.data.meta);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [schoolId, page, router, reloadKey]);

  const refetch = () => setReloadKey((prev) => prev + 1);

  return { announcements, meta, page, setPage, loading, error, refetch };
};
