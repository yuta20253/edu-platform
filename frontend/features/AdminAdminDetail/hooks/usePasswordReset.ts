"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UsePasswordResetParams = {
  adminId: number;
  email: string;
  // 送信成功時に呼ばれる（スナックバー表示など）
  onSuccess: () => void;
  // 送信失敗時に呼ばれる（スナックバー表示など）
  onError: () => void;
};

// 対象管理者にパスワード再設定メールを送信するフック。
export const usePasswordReset = ({
  adminId,
  email,
  onSuccess,
  onError,
}: UsePasswordResetParams) => {
  const [resettingPassword, setResettingPassword] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async () => {
    setResettingPassword(true);

    try {
      await apiClient.post(`/api/admin/admins/${adminId}/password-reset`, {
        email,
      });
      onSuccess();
    } catch (err) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        router.push("/login");
        return;
      }

      onError();
    } finally {
      setResettingPassword(false);
    }
  };

  return { resettingPassword, handlePasswordReset };
};
