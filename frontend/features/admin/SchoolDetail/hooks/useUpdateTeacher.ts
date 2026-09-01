"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UpdateTeacherInput } from "../types";

type UseUpdateTeacherParams = {
  schoolId: number;
  teacherId: number;
  // 更新成功後に呼ばれる（一覧の再取得・ドロワーを閉じるなど）
  onUpdated: () => void;
};

// 教師の更新を行うフック。姓/名を結合してPATCHで送る。
export const useUpdateTeacher = ({
  schoolId,
  teacherId,
  onUpdated,
}: UseUpdateTeacherParams) => {
  const [updating, setUpdating] = useState(false);
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleUpdate = async (input: UpdateTeacherInput) => {
    setUpdating(true);
    setUpdateErrors([]);

    try {
      await apiClient.patch(
        `/api/admin/schools/${schoolId}/teachers/${teacherId}`,
        {
          name: `${input.lastName} ${input.firstName}`,
          email: input.email,
          grade_scope: input.gradeScope,
          manage_other_teachers: input.manageOtherTeachers,
          grade_ids: input.gradeIds,
        },
      );
      onUpdated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setUpdateErrors(errors ?? ["教師の更新に失敗しました"]);
    } finally {
      setUpdating(false);
    }
  };

  return { updating, updateErrors, handleUpdate };
};
