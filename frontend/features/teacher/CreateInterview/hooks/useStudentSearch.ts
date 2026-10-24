"use client";

import { useEffect, useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { StudentOption, StudentOptionsData } from "../types";

// 入力のたびに問い合わせないよう、入力が止まってから検索する
export const SEARCH_DEBOUNCE_MS = 300;
const PER_PAGE = "20";

// 生徒名で担当範囲の生徒を検索する。全員を一度に取得するとバックエンドの上限(100件)を
// 超える学年があるため、候補はサーバー側で絞り込む
export const useStudentSearch = (keyword: string) => {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedKeyword(keyword),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [keyword]);

  const params: Record<string, string> = { page: "1", per_page: PER_PAGE };
  const trimmed = debouncedKeyword.trim();
  if (trimmed) params.keyword = trimmed;

  const { data, error } = useApiQuery<StudentOptionsData>(
    "/api/teacher/students",
    { params },
  );

  // 選択肢には id と名前だけを使う
  const options: StudentOption[] =
    data?.students.map(({ id, name }) => ({ id, name })) ?? [];

  return {
    options,
    error,
    searching: keyword !== debouncedKeyword || (!data && !error),
  };
};
