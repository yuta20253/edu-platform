"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreateAdminInput, SnackbarState } from "../types";

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

type UseCreateAdminParams = {
  // 作成成功後に呼ばれる（一覧の再取得など）
  onCreated: () => void;
};

// 管理者の作成・追加ドロワーの開閉・完了スナックバーを管理するフック。
export const useCreateAdmin = ({ onCreated }: UseCreateAdminParams) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const router = useRouter();

  const handleAddClick = () => {
    setCreateErrors([]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // 管理者を作成。成功でドロワーを閉じて一覧を再取得し、422 はエラーを表示する
  const handleCreate = async (input: CreateAdminInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post("/api/admin/admins", input);
      setDrawerOpen(false);
      setSnackbar({
        open: true,
        message: "管理者を追加しました",
        severity: "success",
      });
      onCreated();
    } catch (err) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { status?: number; data?: { errors?: string[] } };
              }
            ).response
          : undefined;

      if (status?.status === 401) {
        router.push("/login");
        return;
      }

      const errors = status?.data?.errors;
      setCreateErrors(
        Array.isArray(errors) && errors.length > 0
          ? errors
          : ["管理者の追加に失敗しました"],
      );
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
