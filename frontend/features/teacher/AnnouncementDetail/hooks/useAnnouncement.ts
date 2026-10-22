"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { Announcement } from "@/types/announcement/announcement";

export const useAnnouncement = (announcementId: number) =>
  useApiQuery<Announcement>(`/api/teacher/announcements/${announcementId}`);
