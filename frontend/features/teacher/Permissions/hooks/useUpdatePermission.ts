"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PERMISSION_CONFLICT_MESSAGE,
  PERMISSION_NOT_FOUND_MESSAGE,
} from "../constants";
import type {
  PermissionTeacher,
  SnackbarState,
  UpdatePermissionPayload,
} from "../types";

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

type UseUpdatePermissionParams = {
  // 更新成功後などに呼ばれる（一覧の再取得など）
  onUpdated: () => void;
};

export const useUpdatePermission = ({
  onUpdated,
}: UseUpdatePermissionParams) => {
  const [editingTeacher, setEditingTeacher] =
    useState<PermissionTeacher | null>(null);
  // 編集フォームの key。開くたびと 409 のたびに増やして、フォームを作り直し、
  // 最新の権限と lock_version を取り直させる。教員の ID ではなく回数で数えるので、
  // 同じ教員を開き直したときも必ず作り直される
  const [formKey, setFormKey] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const router = useRouter();

  const handleEditClick = (teacher: PermissionTeacher) => {
    setUpdateErrors([]);
    setFormKey((key) => key + 1);
    setEditingTeacher(teacher);
  };

  const handleDrawerClose = () => {
    setEditingTeacher(null);
    setUpdateErrors([]);
  };

  const handleUpdate = async (payload: UpdatePermissionPayload) => {
    if (!editingTeacher) return;

    setUpdating(true);
    setUpdateErrors([]);

    try {
      await apiClient.patch(`/api/teacher/permissions/${editingTeacher.id}`, {
        teacher_permission: payload,
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
        return;
      }

      // ほかの人が先に変更していた。ドロワーは開いたまま、フォームを作り直して最新の値を見せる
      if (status === 409) {
        setUpdateErrors([PERMISSION_CONFLICT_MESSAGE]);
        setFormKey((key) => key + 1);
        onUpdated();
        return;
      }

      // 開いている間に自分の「他の教員操作権限」が外された。編集を続けられないので閉じる
      if (status === 403) {
        setEditingTeacher(null);
        setSnackbar({
          open: true,
          message: errors?.[0] ?? "権限の更新に失敗しました",
          severity: "error",
        });
        onUpdated();
        return;
      }

      // 削除済みの教員も一覧に残るため、一覧は取り直さない
      if (status === 404) {
        setUpdateErrors([PERMISSION_NOT_FOUND_MESSAGE]);
        return;
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
    formKey,
    updating,
    updateErrors,
    snackbar,
    handleEditClick,
    handleDrawerClose,
    handleUpdate,
    handleSnackbarClose,
  };
};
