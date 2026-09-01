"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { NotificationResultsData } from "./types";

export const useNotificationResults = () => {
  const [data, setData] = useState<NotificationResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<NotificationResultsData>("/api/teacher/teacher_notification_results")
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { data, loading };
};
