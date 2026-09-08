"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import axios from "axios";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { NoticesData, NoticeStatus } from "../types";

// お知らせ一覧を取得するフック。
// 検索文字列(q)は300msデバウンスし、q/statusの変更でページを1に戻す。
export const useFetchNotices = () => {
  const [data, setData] = useState<NoticesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<NoticeStatus | "">("");
  const router = useRouter();

  const applyQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
        setPage(1);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      applyQuery.cancel();
    };
  }, [applyQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    applyQuery(value);
  };

  const handleStatusChange = (value: NoticeStatus | "") => {
    setStatus(value);
    setPage(1);
  };

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    if (debouncedQuery) params.q = debouncedQuery;
    if (status) params.status = status;

    // フィルタを素早く連続変更した際、古いリクエストのレスポンスが新しい
    // レスポンスを上書きしないよう、リクエストごとにキャンセルする
    const controller = new AbortController();

    setLoading(true);
    setError(false);
    apiClient
      .get<NoticesData>("/api/admin/announcements", {
        params,
        signal: controller.signal,
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [page, debouncedQuery, status, router]);

  return {
    data,
    loading,
    error,
    page,
    setPage,
    query,
    status,
    onQueryChange: handleQueryChange,
    onStatusChange: handleStatusChange,
  };
};
