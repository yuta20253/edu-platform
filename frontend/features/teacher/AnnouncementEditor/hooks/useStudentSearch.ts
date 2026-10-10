"use client";

import debounce from "lodash/debounce";
import { useEffect, useMemo, useState } from "react";
import { useAnnouncementTargetOptions } from "./useAnnouncementTargetOptions";

// 配信先「個人」の生徒検索を行うフック。行ごとに独立した検索状態を持つ。
// 入力値(query)は即時反映し、APIに渡すキーワードは入力のたびにリクエストしないよう300msデバウンスする。
export const useStudentSearch = () => {
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const applyKeyword = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        setPage(1);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      applyKeyword.cancel();
    };
  }, [applyKeyword]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    applyKeyword(value);
  };

  const { data } = useAnnouncementTargetOptions(keyword, page);

  return {
    query,
    handleQueryChange,
    page,
    setPage,
    students: data?.students ?? null,
  };
};
