"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useCourses } from "@/hooks/useCourses";
import { SubjectName } from "@/constants/subject";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsDataMap, AnalyticsType } from "./types";

const needsCourse = (type: AnalyticsType) =>
  type === "course_rank" || type === "unit_rank";
const needsUnit = (type: AnalyticsType) => type === "unit_rank";

export const useAnalytics = () => {
  const [type, setTypeState] = useState<AnalyticsType>("task_completion");
  const [subject, setSubjectState] = useState<SubjectName | null>(null);
  const [courseId, setCourseIdState] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [data, setData] = useState<AnalyticsDataMap[AnalyticsType] | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const { courses, fetchCourse } = useCourses();

  const setType = (nextType: AnalyticsType) => {
    setTypeState(nextType);
    setSubjectState(null);
    setCourseIdState(null);
    setUnitId(null);
    setData(null);
  };

  const setSubject = (nextSubject: SubjectName) => {
    setSubjectState(nextSubject);
    setCourseIdState(null);
    setUnitId(null);
    fetchCourse(nextSubject);
  };

  const setCourseId = (nextCourseId: number) => {
    setCourseIdState(nextCourseId);
    setUnitId(null);
  };

  const selectedCourse = courses?.find((c) => c.id === courseId) ?? null;
  const units = selectedCourse?.units ?? [];

  const canFetch =
    (!needsCourse(type) || courseId !== null) &&
    (!needsUnit(type) || unitId !== null);

  useEffect(() => {
    if (!canFetch) {
      setData(null);
      return;
    }

    const params: Record<string, string> = { type };
    if (courseId !== null) params.course_id = String(courseId);
    if (unitId !== null) params.unit_id = String(unitId);

    setLoading(true);
    setError(false);

    apiClient
      .get<AnalyticsDataMap[AnalyticsType]>("/api/student/analytics", {
        params,
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setData(null);
      })
      .finally(() => setLoading(false));
    // canFetch is derived from type/courseId/unitId and doesn't need its own entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, courseId, unitId, canFetch, router]);

  return {
    type,
    setType,
    subject,
    setSubject,
    courseId,
    setCourseId,
    unitId,
    setUnitId,
    courses,
    units,
    data,
    loading,
    error,
  };
};
