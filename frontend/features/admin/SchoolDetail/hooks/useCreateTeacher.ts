"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreateTeacherInput } from "../types";

type UseCreateTeacherParams = {
  schoolId: number;
  // 作成成功後に呼ばれる（一覧の再取得・ドロワーを閉じるなど）
  onCreated: () => void;
};

// 教師の新規追加を行うフック。姓/名を結合してAPIへ送る。
export const useCreateTeacher = ({
  schoolId,
  onCreated,
}: UseCreateTeacherParams) => {
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleCreate = async (input: CreateTeacherInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post(`/api/admin/schools/${schoolId}/teachers`, {
        name: `${input.lastName.trim()} ${input.firstName.trim()}`,
        email: input.email,
        grade_scope: input.gradeScope,
        manage_other_teachers: input.manageOtherTeachers,
        grade_ids: input.gradeIds,
      });
      onCreated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setCreateErrors(errors ?? ["教師の追加に失敗しました"]);
    } finally {
      setCreating(false);
    }
  };

  return { creating, createErrors, handleCreate };
};
