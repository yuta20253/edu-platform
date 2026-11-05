"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { useMemo } from "react";
import { GradeOption } from "../types";

// 取得前は null。取得できた空配列([])は有効な値(学級が0件の学校)
export const useGradeOptions = (restrictedGradeId: number | null) => {
  const { data, error, refetch } = useApiQuery<GradeOption[]>(
    "/api/teacher/school-classes",
  );

  const gradeOptions = useMemo(() => {
    if (!data) return null;

    return restrictedGradeId == null
      ? data
      : data.filter((grade) => grade.id === restrictedGradeId);
  }, [data, restrictedGradeId]);

  return { gradeOptions, error, refetch };
};
