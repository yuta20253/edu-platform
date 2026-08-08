"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreateTeacherInput, SnackbarState } from "../types";
import { UseFormReturn } from "react-hook-form";

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

type UseCreateTeacherParams = {
  // 作成成功後に呼ばれる（一覧の再取得など）
  onCreated: () => void;
  form: UseFormReturn<CreateTeacherInput>;
};

export const useCreateColleague = ({
  onCreated,
  form,
}: UseCreateTeacherParams) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const router = useRouter();

  const handleAddClick = () => {
    form.reset();
    setCreateErrors([]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    form.reset();
    setDrawerOpen(false);
    setCreateErrors([]);
  };

  const handleCreate = async (input: CreateTeacherInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post("/api/teacher/colleagues", input);
      setDrawerOpen(false);
      setSnackbar({
        open: true,
        message: "管理者を追加しました",
        severity: "success",
      });
      onCreated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
      }

      setCreateErrors(errors ?? ["教員の追加に失敗しました"]);
    } finally {
      setCreating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    drawerOpen,
    creating,
    createErrors,
    snackbar,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
    handleSnackbarClose,
  };
};
