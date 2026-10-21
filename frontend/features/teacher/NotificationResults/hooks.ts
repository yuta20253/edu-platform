"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { NotificationResultsData } from "./types";

export const useNotificationResults = () =>
  useApiQuery<NotificationResultsData>(
    "/api/teacher/teacher_notification_results",
  );
