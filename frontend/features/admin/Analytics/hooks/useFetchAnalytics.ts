"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { filtersFromSearchParams, filtersToSearchParams } from "../filters";
import { uniqueSubjects } from "../selectors";
import type {
  AnalyticsData,
  AnalyticsFilters,
  HighSchoolOption,
  SubjectOption,
} from "../types";

type PagedMeta = { meta: { total_pages: number } };
type SchoolsResponse = PagedMeta & { schools: HighSchoolOption[] };
type CoursesResponse = PagedMeta & {
  courses: { subject: SubjectOption | null }[];
};

const OPTIONS_PER_PAGE = 100;
const FALLBACK_VALIDATION_MESSAGE = "指定した条件では集計できません";

// 選択肢用に全ページを取得する（Rails 側の per_page 上限は 100）。
const fetchAllPages = async <TResponse extends PagedMeta, TItem>(
  url: string,
  pick: (response: TResponse) => TItem[],
): Promise<TItem[]> => {
  const items: TItem[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await apiClient.get<TResponse>(url, {
      params: { page, per_page: OPTIONS_PER_PAGE },
    });
    items.push(...pick(res.data));
    totalPages = res.data.meta.total_pages;
    page += 1;
  } while (page <= totalPages);
  return items;
};

const validationMessages = (err: unknown): string[] => {
  const errors = (err as { response?: { data?: { errors?: unknown } } })
    .response?.data?.errors;
  return Array.isArray(errors) && errors.length > 0
    ? errors.map(String)
    : [FALLBACK_VALIDATION_MESSAGE];
};

export const useFetchAnalytics = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [highSchoolOptions, setHighSchoolOptions] = useState<
    HighSchoolOption[]
  >([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);

  // フィルタの正はURLクエリ。共有・リロードしても同じ表示になる。
  const queryKey = searchParams.toString();
  const filters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const requestKey = filtersToSearchParams(filters).toString();

  useEffect(() => {
    Promise.allSettled([
      fetchAllPages<SchoolsResponse, HighSchoolOption>(
        "/api/admin/schools",
        (res) => res.schools,
      ),
      fetchAllPages<CoursesResponse, { subject: SubjectOption | null }>(
        "/api/admin/courses",
        (res) => res.courses,
      ),
    ]).then(([schoolsResult, coursesResult]) => {
      // 片方が失敗してももう片方は反映する。選択肢が空でも画面は使える。
      if (schoolsResult.status === "fulfilled") {
        setHighSchoolOptions(
          schoolsResult.value.map(({ id, name }) => ({ id, name })),
        );
      } else if (schoolsResult.reason?.response?.status === 401) {
        router.push("/login");
      }

      if (coursesResult.status === "fulfilled") {
        setSubjectOptions(uniqueSubjects(coursesResult.value));
      } else if (coursesResult.reason?.response?.status === 401) {
        router.push("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    // フィルタを素早く連続変更した際、古いリクエストのレスポンスが
    // 新しいレスポンスを上書きしないよう、リクエストごとにキャンセルする
    const controller = new AbortController();

    setLoading(true);
    setError(false);
    apiClient
      .get<AnalyticsData>("/api/admin/analytics", {
        params: Object.fromEntries(new URLSearchParams(requestKey)),
        signal: controller.signal,
      })
      .then((res) => {
        setData(res.data);
        setValidationErrors([]);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setLoading(false);
        const status = err.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        // 期間不正などは全画面エラーにせず、フィルタ直下にメッセージを出す
        if (status === 422) {
          setValidationErrors(validationMessages(err));
          return;
        }
        setError(true);
      });

    return () => {
      controller.abort();
    };
  }, [requestKey, reloadKey, router]);

  // router.replace は非同期で、searchParams に反映されるまで時間がかかる。
  // 開始日→終了日のように続けて変更したとき、描画済みの filters を元にすると
  // 直前の変更が元に戻ってしまうため、反映待ちの最新値を ref に持つ。
  const latestFilters = useRef(filters);
  useEffect(() => {
    latestFilters.current = filters;
  }, [filters]);

  const onFiltersChange = useCallback(
    (patch: Partial<AnalyticsFilters>) => {
      const next = { ...latestFilters.current, ...patch };
      latestFilters.current = next;
      const query = filtersToSearchParams(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router],
  );

  const onRetry = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    data,
    error,
    validationErrors,
    isInitialLoading: loading && data === null,
    isRefetching: loading && data !== null,
    filters,
    highSchoolOptions,
    subjectOptions,
    onFiltersChange,
    onRetry,
  };
};
