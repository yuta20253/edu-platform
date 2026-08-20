"use client";

import { useState } from "react";

// 同じ列を再クリックしたらasc/descをトグルし、別の列ならascから開始する
// ソート状態管理。AdminCourses/AdminImportHistoryのソート可能な一覧で共通利用する。
export const useSortToggle = <TSort extends string>(
  initialSort: TSort,
  initialOrder: "asc" | "desc" = "desc",
) => {
  const [sort, setSort] = useState<TSort>(initialSort);
  const [order, setOrder] = useState<"asc" | "desc">(initialOrder);

  const toggleSort = (nextSort: TSort) => {
    if (sort === nextSort) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder("asc");
    }
  };

  return { sort, order, toggleSort };
};
