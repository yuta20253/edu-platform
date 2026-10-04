"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GradeScope } from "../types";

type MeResponse = {
  user: {
    grade?: { id: number } | null;
    teacher_permission?: { grade_scope: GradeScope } | null;
  };
};

export const useCurrentTeacher = () => {
  const [gradeScope, setGradeScope] = useState<GradeScope | null>(null);
  const [restrictedGradeId, setRestrictedGradeId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<MeResponse>("/api/teacher/me")
      .then((res) => {
        const { grade, teacher_permission } = res.data.user;
        const scope = teacher_permission?.grade_scope ?? null;

        setGradeScope(scope);
        setRestrictedGradeId(
          scope === "own_grade" ? (grade?.id ?? null) : null,
        );
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { gradeScope, restrictedGradeId, loading, error };
};
