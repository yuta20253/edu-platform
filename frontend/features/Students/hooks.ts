"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StudentType = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    display_name: string;
  };
};

type StudentMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

type StudentsData = {
  students: StudentType[];
  meta: StudentMeta;
};

export const useStudents = () => {
  const [data, setData] = useState<StudentsData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };

    setLoading(true);

    apiClient
      .get<StudentsData>("/api/teacher/students", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [page, router]);

  return { data, page, loading, setPage };
};
