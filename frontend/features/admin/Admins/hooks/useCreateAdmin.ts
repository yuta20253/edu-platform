"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { CreateAdminInput } from "../types";

type UseCreateAdminParams = {
  // 作成成功後に呼ばれる（一覧の再取得など）
  onCreated: () => void;
};

// 管理者の作成・追加ドロワーの開閉と完了トーストを管理するフック。
export const useCreateAdmin = ({ onCreated }: UseCreateAdminParams) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const router = useRouter();
  const toast = useToast();

  const handleAddClick = () => {
    setCreateErrors([]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCreateErrors([]);
  };

  // 管理者を作成。成功でドロワーを閉じて一覧を再取得し、422 はエラーを表示する
  const handleCreate = async (input: CreateAdminInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post("/api/admin/admins", input);
      setDrawerOpen(false);
      toast.show({ message: "管理者を追加しました" });
      onCreated();
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setCreateErrors(errors ?? ["管理者の追加に失敗しました"]);
    } finally {
      setCreating(false);
    }
  };

  return {
    drawerOpen,
    creating,
    createErrors,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
  };
};
