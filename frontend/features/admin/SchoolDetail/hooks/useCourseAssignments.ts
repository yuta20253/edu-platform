"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { CourseAssignment, CourseAssignmentsData } from "../types";

// コース割当タブの一覧取得・割当・解除をまとめて扱うフック。
export const useCourseAssignments = (schoolId: number) => {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationErrors, setMutationErrors] = useState<string[]>([]);
  const router = useRouter();

  const fetchAssignments = useCallback(() => {
    setLoading(true);

    return apiClient
      .get<CourseAssignmentsData>(
        `/api/admin/schools/${schoolId}/course_assignments`,
      )
      .then((res) => setAssignments(res.data.course_assignments))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [schoolId, router]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleAssign = async (courseId: number): Promise<boolean> => {
    setMutationErrors([]);

    try {
      await apiClient.post(
        `/api/admin/schools/${schoolId}/course_assignments`,
        { course_id: courseId },
      );
      await fetchAssignments();
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return false;
      }

      setMutationErrors(errors ?? ["コースの割当に失敗しました"]);
      return false;
    }
  };

  const handleUnassign = async (courseId: number) => {
    setMutationErrors([]);

    try {
      await apiClient.delete(
        `/api/admin/schools/${schoolId}/course_assignments/${courseId}`,
      );
      await fetchAssignments();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setMutationErrors(errors ?? ["コース割当の解除に失敗しました"]);
    }
  };

  return { assignments, loading, mutationErrors, handleAssign, handleUnassign };
};
