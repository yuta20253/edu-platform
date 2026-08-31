"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import type {
  PermissionTeacher,
  SnackbarState,
  UpdatePermissionInput,
} from "../types";

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

type UseUpdatePermissionParams = {
  // 更新成功後に呼ばれる（一覧の再取得など）
  onUpdated: () => void;
  form: UseFormReturn<UpdatePermissionInput>;
};

export const useUpdatePermission = ({
  onUpdated,
  form,
}: UseUpdatePermissionParams) => {
  const [editingTeacher, setEditingTeacher] =
    useState<PermissionTeacher | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const router = useRouter();

  const handleEditClick = (teacher: PermissionTeacher) => {
    form.reset({
      grade_scope: teacher.teacher_permission.grade_scope,
      manage_other_teachers: teacher.teacher_permission.manage_other_teachers,
    });
    setUpdateErrors([]);
    setEditingTeacher(teacher);
  };

  const handleDrawerClose = () => {
    form.reset();
    setEditingTeacher(null);
    setUpdateErrors([]);
  };

  const handleUpdate = async (input: UpdatePermissionInput) => {
    if (!editingTeacher) return;

    setUpdating(true);
    setUpdateErrors([]);

    try {
      await apiClient.patch(`/api/teacher/permissions/${editingTeacher.id}`, {
        teacher_permission: input,
      });
      setEditingTeacher(null);
      setSnackbar({
        open: true,
        message: "権限を更新しました",
        severity: "success",
      });
      onUpdated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
      }

      setUpdateErrors(errors ?? ["権限の更新に失敗しました"]);
    } finally {
      setUpdating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    editingTeacher,
    updating,
    updateErrors,
    snackbar,
    handleEditClick,
    handleDrawerClose,
    handleUpdate,
    handleSnackbarClose,
  };
};
