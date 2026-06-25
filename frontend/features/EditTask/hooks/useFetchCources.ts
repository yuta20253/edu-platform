"use client";

import { apiClient } from "@/libs/http/apiClient";
import { Course } from "../types";
import { SubjectName } from "@/constants/subject";
import { useState } from "react";

export const useFetchCourses = () => {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showAllCourses, setShowAllCourses] = useState<boolean>(false);

  const fetchCourse = async (name: SubjectName) => {
    setSelectedCourseId(null);
    setShowAllCourses(false);
    try {
      const res = await apiClient.get<Course[]>(
        `/api/student/courses?subject=${name}`,
      );

      setCourses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const selectedCourse =
    courses?.find((c) => c.id === selectedCourseId) ?? null;

  const displayedCourses = showAllCourses ? courses : courses?.slice(0, 3);

  return {
    courses,
    selectedCourseId,
    showAllCourses,
    fetchCourse,
    selectedCourse,
    displayedCourses,
    setSelectedCourseId,
    setShowAllCourses,
  };
};
