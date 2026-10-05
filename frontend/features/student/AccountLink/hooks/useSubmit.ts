"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { AccountLinkForm } from "../types";

export const useSubmit = () => {
  const router = useRouter();
  const { show } = useToast();
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit: SubmitHandler<AccountLinkForm> = async (data) => {
    setErrorMessage("");

    try {
      await apiClient.post("/api/student/account-link", {
        student_number: data.student_number,
      });

      show({
        message: "アカウントの紐付けが完了しました",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (error) {
      const { status, errors } = extractApiError(error);

      if (status === 401) {
        router.push("/login");
        return;
      }

      if (status === 404) {
        setErrorMessage("入力された生徒コードが見つかりません");
        return;
      }

      setErrorMessage(errors?.[0] ?? "アカウントの紐付けに失敗しました");
    }
  };

  return { onSubmit, errorMessage };
};
