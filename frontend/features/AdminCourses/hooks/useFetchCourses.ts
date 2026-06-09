"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { AdminCoursesData, CourseOrder, CourseSort } from "../types";

const SEARCH_DEBOUNCE_MS = 300;

export const useFetchCourses = () => {
  const [data, setData] = useState<AdminCoursesData | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<CourseSort>("created_at");
  const [order, setOrder] = useState<CourseOrder>("desc");
  const router = useRouter();

  // 検索ワードを debounce して過剰なリクエストを抑制する
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: String(perPage),
      sort,
      order,
    };
    if (debouncedQ !== "") {
      params.q = debouncedQ;
    }

    apiClient
      .get<AdminCoursesData>("/api/admin/courses", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, perPage, debouncedQ, sort, order, router]);

  const handleSearchChange = (value: string) => {
    setQ(value);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const handleSortChange = (nextSort: CourseSort) => {
    if (sort === nextSort) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder("asc");
    }
    setPage(1);
  };

  return {
    data,
    q,
    perPage,
    sort,
    order,
    page,
    onSearchChange: handleSearchChange,
    onPerPageChange: handlePerPageChange,
    onSortChange: handleSortChange,
    onPageChange: setPage,
  };
};
