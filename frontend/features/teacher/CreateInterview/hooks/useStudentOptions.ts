"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { StudentOptionsData } from "../types";

// 生徒候補は1回で取得する。バックエンドの per_page の上限
const PER_PAGE = "100";

export const useStudentOptions = () => {
  const { data, error, refetch } = useApiQuery<StudentOptionsData>(
    "/api/teacher/students",
    { params: { page: "1", per_page: PER_PAGE } },
  );

  // 選択肢には id と名前だけを使う
  const options = data
    ? data.students.map(({ id, name }) => ({ id, name }))
    : null;

  return { data: options, error, refetch };
};
