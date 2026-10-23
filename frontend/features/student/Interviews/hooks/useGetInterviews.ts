"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { InterviewsData, InterviewStatusFilter } from "../types";

export const useGetInterviews = () => {
  const [page, setPage] = useState(1);
  const [status, setStatusState] = useState<InterviewStatusFilter>("all");

  const params: Record<string, string> = { page: String(page) };
  if (status !== "all") params.status = status;

  const { data, error, refetch } = useApiQuery<InterviewsData>(
    "/api/student/interview-requests",
    { params },
  );

  const setStatus = (next: InterviewStatusFilter) => {
    setStatusState(next);
    setPage(1);
  };

  return { data, page, setPage, status, setStatus, error, refetch };
};
