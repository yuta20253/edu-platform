"use client";

import debounce from "lodash/debounce";
import { useEffect, useMemo, useState } from "react";

// 検索クエリとページングを管理するフック。
// 入力値(query)は即時反映し、API に渡す値(debouncedQuery)は 300ms デバウンスする。
export const useAdminSearch = () => {
  const [page, setPage] = useState(1);
  // 入力欄の値（query）と実際の検索値（debouncedQuery）を分ける
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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

  return {
    page,
    setPage,
    query,
    debouncedQuery,
    handleQueryChange,
  };
};
