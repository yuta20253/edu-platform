"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { AnnouncementsData } from "../types";

export const useGetAnnouncements = () => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<AnnouncementsData>(
    "/api/student/announcements",
    { params: { page: String(page) } },
  );

  return { data, page, setPage, error, refetch };
};
