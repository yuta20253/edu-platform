"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { useCourses } from "@/hooks/useCourses";
import { SubjectName } from "@/constants/subject";
import { useState } from "react";
import { ANALYTICS_URL } from "../constants";
import { RankData, RankParams, RankType } from "../types";

// 順位(コース内・単元内)を取得する。教科→コース(→単元)を選び終えたら取得する
export const useFetchRank = () => {
  const [type, setTypeState] = useState<RankType>("course_rank");
  const [subject, setSubjectState] = useState<SubjectName | null>(null);
  const [courseId, setCourseIdState] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);

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

  const params = toRankParams(type, courseId, unitId);
  const { data, error, refetch } = useApiQuery<RankData>(ANALYTICS_URL, {
    params: params ?? undefined,
    enabled: params !== null,
    // 選択が変わると別の対象の順位になるため、前の順位を残さない
    keepPreviousData: false,
  });

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
    selectionComplete: params !== null,
    data,
    error,
    refetch,
  };
};

// 選択が揃っていなければ null(取得しない)
const toRankParams = (
  type: RankType,
  courseId: number | null,
  unitId: number | null,
): RankParams | null => {
  if (courseId === null) return null;
  if (type === "course_rank") {
    return { type, course_id: String(courseId) };
  }
  if (unitId === null) return null;
  return { type, course_id: String(courseId), unit_id: String(unitId) };
};
