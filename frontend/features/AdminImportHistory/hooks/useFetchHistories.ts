"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type {
  ImportHistoriesData,
  ImportHistoryFilters,
  ImportHistoryOrder,
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
  const [sort, setSort] = useState<ImportHistorySort>("created_at");
  const [order, setOrder] = useState<ImportHistoryOrder>("desc");
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<AdminCoursesData>("/api/admin/courses", { params: { per_page: 100 } })
      .then((res) => setCourseOptions(res.data.courses))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  useEffect(() => {
    apiClient
      .get<AdminAdminsData>("/api/admin/admins", { params: { per_page: 100 } })
      .then((res) => setUserOptions(res.data.admins))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  useEffect(() => {
    if (!filters.courseId) {
      setUnitOptions([]);
      return;
    }

    apiClient
      .get<AdminCourseDetailData>(`/api/admin/courses/${filters.courseId}`)
      .then((res) => setUnitOptions(res.data.units))
      .catch(() => setUnitOptions([]));
  }, [filters.courseId]);

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      sort,
      order,
    };
    if (filters.status) params.status = filters.status;
    if (filters.courseId) params.course_id = filters.courseId;
    if (filters.unitId) params.unit_id = filters.unitId;
    if (filters.userId) params.user_id = filters.userId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    setError(false);
    apiClient
      .get<ImportHistoriesData>("/api/admin/import_histories", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      });
  }, [page, sort, order, filters, router]);

  const handleStatusChange = (status: ImportHistoryStatus | "") => {
    setFilters((prev) => ({ ...prev, status }));
    setPage(1);
  };

  const handleCourseChange = (courseId: string) => {
    setFilters((prev) => ({ ...prev, courseId, unitId: "" }));
    setPage(1);
  };

  const handleUnitChange = (unitId: string) => {
    setFilters((prev) => ({ ...prev, unitId }));
    setPage(1);
  };

  const handleUserChange = (userId: string) => {
    setFilters((prev) => ({ ...prev, userId }));
    setPage(1);
  };

  const handleFromChange = (from: string) => {
    setFilters((prev) => ({ ...prev, from }));
    setPage(1);
  };

  const handleToChange = (to: string) => {
    setFilters((prev) => ({ ...prev, to }));
    setPage(1);
  };

  const handleSortChange = (nextSort: ImportHistorySort) => {
    if (sort === nextSort) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder("asc");
    }
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
    onStatusChange: handleStatusChange,
    onCourseChange: handleCourseChange,
    onUnitChange: handleUnitChange,
    onUserChange: handleUserChange,
    onFromChange: handleFromChange,
    onToChange: handleToChange,
    onSortChange: handleSortChange,
    onPageChange: setPage,
    onRowClick: handleRowClick,
  };
};
