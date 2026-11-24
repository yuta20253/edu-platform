"use client";

import { apiClient } from "@/libs/http/apiClient";
import { SubjectName } from "@/constants/subject";
import { useCallback, useState } from "react";
import { Course } from "@/types/tasks/course";

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showAllCourses, setShowAllCourses] = useState<boolean>(false);
  // 教科セレクトを controlled にするための、選択中の教科
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | null>(
    null,
  );

  // 取得に成功したかを返す(失敗時は false)。呼び出し側が成功時だけ後続の処理をできるようにする
  const fetchCourse = useCallback(async (name: SubjectName) => {
    setSelectedSubject(name);
    setSelectedCourseId(null);
    setShowAllCourses(false);
    try {
      const res = await apiClient.get<Course[]>(
        `/api/student/courses?subject=${name}`,
      );

      setCourses(res.data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }, []);

  const selectedCourse =
    courses?.find((c) => c.id === selectedCourseId) ?? null;

  const displayedCourses = showAllCourses ? courses : courses?.slice(0, 3);

  return {
    courses,
    selectedCourseId,
    selectedSubject,
    showAllCourses,
    fetchCourse,
    selectedCourse,
    displayedCourses,
    setSelectedCourseId,
    setShowAllCourses,
  };
};
