"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { AccountLinkForm } from "../types";

export const useSubmit = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit: SubmitHandler<AccountLinkForm> = async (data) => {
    setErrorMessage("");

    try {
      await apiClient.post("/api/student/account-link", {
        student_number: data.student_number,
      });

      router.push("/");
    } catch (error) {
      const { status, errors } = extractApiError(error);

      if (status === 404) {
        setErrorMessage("入力された生徒コードが見つかりません");
        return;
      }

      setErrorMessage(errors?.[0] ?? "アカウントの紐付けに失敗しました");
    }
  };

  return { onSubmit, errorMessage };
};
