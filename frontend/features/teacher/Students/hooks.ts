"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { StudentsData } from "./types";

export const useStudents = () => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<StudentsData>(
    "/api/teacher/students",
    { params: { page: String(page) } },
  );

  return { data, error, refetch, page, setPage };
};
