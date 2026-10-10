"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PER_PAGE } from "@/constants/pagination";
import { useSortToggle } from "@/hooks/useSortToggle";
import { apiClient } from "@/libs/http/apiClient";
import type { CoursesData, CourseSort } from "../types";

const SEARCH_DEBOUNCE_MS = 300;

export const useFetchCourses = () => {
  const [data, setData] = useState<CoursesData | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { sort, order, toggleSort } = useSortToggle<CourseSort>("created_at");
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

    setError(false);
    apiClient
      .get<CoursesData>("/api/admin/courses", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      });
  }, [page, perPage, debouncedQ, sort, order, router, reloadKey]);

  const handleSearchChange = (value: string) => {
    setQ(value);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const handleSortChange = (nextSort: CourseSort) => {
    toggleSort(nextSort);
    setPage(1);
  };

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  return {
    data,
    error,
    q,
    perPage,
    sort,
    order,
    page,
    onSearchChange: handleSearchChange,
    onPerPageChange: handlePerPageChange,
    onSortChange: handleSortChange,
    onPageChange: setPage,
    onRetry: handleRetry,
  };
};
