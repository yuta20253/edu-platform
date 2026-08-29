"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { CourseOption } from "../types";

type CoursesResponse = {
  courses: CourseOption[];
};

// Step1のセレクト用に全件相当を軽量取得する（一覧画面のページネーション付きフックとは別物）
const PER_PAGE = "100";

export const useFetchCourseOptions = () => {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    setCoursesLoading(true);

    apiClient
      .get<CoursesResponse>("/api/admin/courses", {
        params: { per_page: PER_PAGE },
        signal: controller.signal,
      })
      .then((res) => {
        setCourses(res.data.courses);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setCourses([]);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCoursesLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [router]);

  return { courses, coursesLoading };
};
