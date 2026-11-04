"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UpdateTeacherInput } from "../types";

type UseUpdateTeacherParams = {
  schoolId: number;
  teacherId: number;
  // 編集を開いた時点の権限の版。開いた後に権限が変わっていれば 409 になる
  permissionLockVersion: number;
  // 更新成功後に呼ばれる（一覧の再取得・ドロワーを閉じるなど）
  onUpdated: () => void;
  // 409（開いた後にほかの人が権限を変えた）のときに呼ばれる
  onConflict: () => void;
};

// 教師の更新を行うフック。姓/名を結合してPATCHで送る。
export const useUpdateTeacher = ({
  schoolId,
  teacherId,
  permissionLockVersion,
  onUpdated,
  onConflict,
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
          name: `${input.lastName.trim()} ${input.firstName.trim()}`,
          email: input.email,
          grade_scope: input.gradeScope,
          manage_other_teachers: input.manageOtherTeachers,
          grade_ids: input.gradeIds,
          permission_lock_version: permissionLockVersion,
        },
      );
      onUpdated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      // updateErrors はドロワーを閉じても残るので、409 は入れずに呼び出し側へ任せる
      if (status === 409) {
        onConflict();
        return;
      }

      setUpdateErrors(errors ?? ["教師の更新に失敗しました"]);
    } finally {
      setUpdating(false);
    }
  };

  return { updating, updateErrors, handleUpdate };
};
