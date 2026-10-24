"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { TeachersData } from "../types";

export const useFetchTeachers = () => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<TeachersData>(
    "/api/teacher/teachers",
    { params: { page: String(page) } },
  );

  return { data, error, page, setPage, refetch };
};
