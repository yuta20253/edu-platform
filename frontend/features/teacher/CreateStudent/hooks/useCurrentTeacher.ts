"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { useMemo } from "react";
import { GradeScope } from "../types";

type MeResponse = {
  user: {
    grade?: { id: number } | null;
    teacher_permission?: { grade_scope: GradeScope } | null;
  };
};

export const useCurrentTeacher = () => {
  const { data, error, refetch } = useApiQuery<MeResponse>("/api/teacher/me");

  const { gradeScope, restrictedGradeId } = useMemo(() => {
    if (!data) return { gradeScope: null, restrictedGradeId: null };

    const { grade, teacher_permission } = data.user;
    const scope = teacher_permission?.grade_scope ?? null;

    return {
      gradeScope: scope,
      restrictedGradeId: scope === "own_grade" ? (grade?.id ?? null) : null,
    };
  }, [data]);

  // data は取得済みかどうかの判定に使う(null の間は取得前)
  return { data, gradeScope, restrictedGradeId, error, refetch };
};
