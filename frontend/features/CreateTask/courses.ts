'use client'

import { apiClient } from "@/libs/http/apiClient";
import { CourseType } from "@/types/task/new/form";
import { SubjectName } from "@/types/task/new/subject";
import { useState } from "react";
import { TOKEN_KEY } from "@context/AuthContext";

export const useCourses = () => {
  const [courses, setCourses] = useState<CourseType[] | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showAllCourses, setShowAllCourses] = useState<boolean>(false);

  const selectSubject = async (name: SubjectName) => {
    setSelectedCourseId(null);
    setShowAllCourses(false);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await apiClient.get<CourseType[]>(
        `/api/v1/student/courses?subject=${name}`,
        { headers },
      );

      setCourses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const selectedCourse =
    courses?.find((c) => c.id === selectedCourseId) ?? null;

  const displayedCourses = showAllCourses ? courses : courses?.slice(0, 3);

  return { courses, selectedCourseId, showAllCourses, selectSubject, selectedCourse, displayedCourses, setSelectedCourseId, setShowAllCourses }
};
