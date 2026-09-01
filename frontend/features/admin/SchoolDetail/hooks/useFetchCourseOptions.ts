"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { CourseOption } from "../types";

type CoursesResponse = {
  courses: CourseOption[];
};

// コース割当ダイアログのセレクト用に、コース一覧を軽量取得する。
const PER_PAGE = "100";

export const useFetchCourseOptions = () => {
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<CoursesResponse>("/api/admin/courses", {
        params: { per_page: PER_PAGE },
      })
      .then((res) => setCourseOptions(res.data.courses))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { courseOptions, loading };
};
