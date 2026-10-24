"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import {
  AnnouncementsResult,
  AnnouncementTab,
  AuthoredAnnouncementsData,
  ReceivedAnnouncementsData,
} from "../types";

// tab が変わると、前のタブの data を新しいタブの data として扱ってしまう。
// 呼び出し側でタブごとに key を変えてコンポーネントを作り直すこと。
export const useAnnouncements = (tab: AnnouncementTab, page: number) => {
  const params: Record<string, string> = { page: String(page) };
  if (tab === "authored") params.tab = "authored";

  const { data, error, refetch } = useApiQuery<
    ReceivedAnnouncementsData | AuthoredAnnouncementsData
  >("/api/teacher/announcements", { params });

  return {
    data: data ? ({ tab, data } as AnnouncementsResult) : null,
    error,
    refetch,
  };
};
