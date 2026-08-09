"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnouncementsData } from "../types";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";

export const useGetAnnouncements = () => {
  const [data, setData] = useState<AnnouncementsData | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchAnnouncements = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };

    apiClient
      .get<AnnouncementsData>("/api/student/announcements", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, router]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { data, page, setPage };
};
