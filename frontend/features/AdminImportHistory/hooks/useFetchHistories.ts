"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useSortToggle } from "@/hooks/useSortToggle";
import type {
  ImportHistoriesData,
  ImportHistoryFilters,
  ImportHistorySort,
  ImportHistoryStatus,
} from "../types";

type CourseOption = { id: number; level_name: string };
type UnitOption = { id: number; unit_name: string };
type UserOption = { id: number; name: string };

type AdminCoursesData = { courses: CourseOption[] };
type AdminCourseDetailData = { units: UnitOption[] };
type AdminAdminsData = { admins: UserOption[] };

const INITIAL_FILTERS: ImportHistoryFilters = {
  status: "",
  courseId: "",
  unitId: "",
  userId: "",
  from: "",
  to: "",
};

export const useFetchHistories = () => {
  const [data, setData] = useState<ImportHistoriesData | null>(null);
  const [error, setError] = useState(false);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [filters, setFilters] = useState<ImportHistoryFilters>(INITIAL_FILTERS);
  const { sort, order, toggleSort } = useSortToggle<ImportHistorySort>("created_at");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiClient.get<AdminCoursesData>("/api/admin/courses", {
        params: { per_page: 100 },
      }),
      apiClient.get<AdminAdminsData>("/api/admin/admins", {
        params: { per_page: 100 },
      }),
    ])
      .then(([coursesRes, adminsRes]) => {
        setCourseOptions(coursesRes.data.courses);
        setUserOptions(adminsRes.data.admins);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  const unitOptionsCache = useRef(new Map<string, UnitOption[]>());

  useEffect(() => {
    if (!filters.courseId) {
      setUnitOptions([]);
      return;
    }

    const cached = unitOptionsCache.current.get(filters.courseId);
    if (cached) {
      setUnitOptions(cached);
      return;
    }

    apiClient
      .get<AdminCourseDetailData>(`/api/admin/courses/${filters.courseId}`)
      .then((res) => {
        unitOptionsCache.current.set(filters.courseId, res.data.units);
        setUnitOptions(res.data.units);
      })
      .catch(() => setUnitOptions([]));
  }, [filters.courseId]);

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: String(perPage),
      sort,
      order,
    };
    if (filters.status) params.status = filters.status;
    if (filters.courseId) params.course_id = filters.courseId;
    if (filters.unitId) params.unit_id = filters.unitId;
    if (filters.userId) params.user_id = filters.userId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    // フィルタを素早く連続変更した際、古いリクエストのレスポンスが新しい
    // レスポンスを上書きしないよう、リクエストごとにキャンセルする
    const controller = new AbortController();

    setError(false);
    apiClient
      .get<ImportHistoriesData>("/api/admin/import_histories", {
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
      });

    return () => {
      controller.abort();
    };
  }, [page, perPage, sort, order, filters, router]);

  const updateFilters = (patch: Partial<ImportHistoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleStatusChange = (status: ImportHistoryStatus | "") => {
    updateFilters({ status });
  };

  const handleCourseChange = (courseId: string) => {
    updateFilters({ courseId, unitId: "" });
  };

  const handleUnitChange = (unitId: string) => {
    updateFilters({ unitId });
  };

  const handleUserChange = (userId: string) => {
    updateFilters({ userId });
  };

  const handleFromChange = (from: string) => {
    updateFilters({ from });
  };

  const handleToChange = (to: string) => {
    updateFilters({ to });
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
  };

  const handleSortChange = (nextSort: ImportHistorySort) => {
    toggleSort(nextSort);
    setPage(1);
  };

  const handleRowClick = (id: number) => {
    router.push(`/admin/csv-import/history/${id}`);
  };

  return {
    data,
    error,
    filters,
    courseOptions,
    unitOptions,
    userOptions,
    sort,
    order,
    page,
    perPage,
    onStatusChange: handleStatusChange,
    onCourseChange: handleCourseChange,
    onUnitChange: handleUnitChange,
    onUserChange: handleUserChange,
    onFromChange: handleFromChange,
    onToChange: handleToChange,
    onSortChange: handleSortChange,
    onPageChange: setPage,
    onPerPageChange: handlePerPageChange,
    onClearFilters: handleClearFilters,
    onRowClick: handleRowClick,
  };
};
