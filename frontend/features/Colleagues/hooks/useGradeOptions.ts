"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GradeOption } from "../types";

export const useGradeOptions = (open: boolean) => {
  const [gradeOptions, setGradeOptions] = useState<GradeOption[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setGradeOptions([]);
      return;
    }

    const fetchGrades = async () => {
      try {
        const res = await apiClient.get<GradeOption[]>(
          "/api/teacher/grades",
        );
        setGradeOptions(res.data);
      } catch (err) {
        const { status } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return;
        }
      }
    };

    fetchGrades();
  }, [open, router]);

  return gradeOptions;
};
