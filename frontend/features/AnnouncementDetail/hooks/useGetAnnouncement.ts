"use client";

import { useEffect, useState } from "react";
import { Announcement } from "@/types/announcement/announcement";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";

export const useGetAnnouncement = (announcementId: number) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Announcement>(`/api/student/announcements/${announcementId}`)
      .then((res) => setAnnouncement(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setAnnouncement(null);
      })
      .finally(() => setLoading(false));
  }, [router, announcementId]);

  return { announcement, loading, error };
};
