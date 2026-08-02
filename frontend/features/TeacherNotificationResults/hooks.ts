"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import {
  TeacherNotificationResult,
  TeacherNotificationResultsData,
} from "./types";

export const useTeacherNotificationResults = () => {
  const [data, setData] = useState<TeacherNotificationResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<TeacherNotificationResultsData>(
        "/api/teacher/teacher_notification_results",
      )
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
