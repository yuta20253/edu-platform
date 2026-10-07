"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GradeOption } from "../types";

export const useGradeOptions = (restrictedGradeId: number | null) => {
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<GradeOption[]>("/api/teacher/school-classes")
      .then((res) => setGrades(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  return useMemo(
    () =>
      restrictedGradeId == null
        ? grades
        : grades.filter((grade) => grade.id === restrictedGradeId),
    [grades, restrictedGradeId],
  );
};
