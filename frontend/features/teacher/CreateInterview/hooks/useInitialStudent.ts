"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { StudentOption } from "../types";

// 生徒詳細から遷移したときに選択しておく生徒を取得する。
// 取得できない(担当外・削除済みなど)ときは未選択のままフォームを出すため、エラー表示にはしない
export const useInitialStudent = (studentId?: number) => {
  const { data, error } = useApiQuery<StudentOption>(
    `/api/teacher/students/${studentId}`,
    { enabled: studentId !== undefined },
  );

  return {
    student: data ? { id: data.id, name: data.name } : null,
    ready: studentId === undefined || data !== null || error,
  };
};
