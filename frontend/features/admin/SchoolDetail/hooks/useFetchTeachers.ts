"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { TeachersData } from "../types";

// 教師一覧をページネーション付きで取得するフック。追加/編集後の再取得用にrefetchも返す。
// 再取得中（ページ切替・refetch）は前回の一覧を残す。loading は初回取得中だけ true になる。
export const useFetchTeachers = (schoolId: number) => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<TeachersData>(
    `/api/admin/schools/${schoolId}/teachers`,
    { params: { page: String(page) } },
  );

  return {
    teachers: data?.teachers ?? [],
    meta: data?.meta ?? null,
    page,
    setPage,
    loading: !data && !error,
    error,
    refetch,
  };
};
