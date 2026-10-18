"use client";

import { apiClient } from "@/libs/http/apiClient";
import axios from "axios";
import { useCourses } from "@/hooks/useCourses";
import { SubjectName } from "@/constants/subject";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RankData, RankType } from "../types";

// 順位(コース内・単元内)を取得する。教科→コース(→単元)を選ぶと取得する
export const useAnalytics = () => {
  const [type, setTypeState] = useState<RankType>("course_rank");
  const [subject, setSubjectState] = useState<SubjectName | null>(null);
  const [courseId, setCourseIdState] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [data, setData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const { courses, fetchCourse } = useCourses();

  // コース内↔単元内を切り替えても、選んだ教科・コースはそのまま使えるので残す
  const setType = (nextType: RankType) => {
    setTypeState(nextType);
    setUnitId(null);
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
    courseId !== null && (type !== "unit_rank" || unitId !== null);

  useEffect(() => {
    if (!canFetch) {
      setData(null);
      setError(false);
      return;
    }

    // typeやcourseId/unitIdが切り替わった際、古いリクエストをキャンセルして
    // 古い応答で新しい選択結果を上書きしないようにする
    const controller = new AbortController();

    const params: Record<string, string> = {
      type,
      course_id: String(courseId),
    };
    if (type === "unit_rank" && unitId !== null) {
      params.unit_id = String(unitId);
    }

    setLoading(true);
    setError(false);

    apiClient
      .get<RankData>("/api/student/analytics", {
        params,
        signal: controller.signal,
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setData(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
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
