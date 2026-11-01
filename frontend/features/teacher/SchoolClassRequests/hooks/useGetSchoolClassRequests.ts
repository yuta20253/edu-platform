"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  SchoolClassRequestsData,
  SchoolClassRequestStatusFilter,
} from "../types";

export const useGetSchoolClassRequests = () => {
  const [page, setPage] = useState(1);
  const [status, setStatusState] =
    useState<SchoolClassRequestStatusFilter>("all");

  const params: Record<string, string> = { page: String(page) };
  if (status !== "all") params.status = status;

  const { data, error, refetch } = useApiQuery<SchoolClassRequestsData>(
    "/api/teacher/school-class-requests",
    { params },
  );

  const setStatus = (next: SchoolClassRequestStatusFilter) => {
    setStatusState(next);
    setPage(1);
  };

  return { data, page, setPage, status, setStatus, error, refetch };
};
