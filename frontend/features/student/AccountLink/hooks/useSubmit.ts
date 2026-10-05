"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { AccountLinkForm } from "../types";

type ToastType = "success" | "error";

const initialToast = {
  open: false,
  message: "",
  severity: "success" as ToastType,
};

export const useSubmit = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(initialToast);

  const onSubmit: SubmitHandler<AccountLinkForm> = async (data) => {
    setErrorMessage("");

    try {
      await apiClient.post("/api/student/account-link", {
        student_number: data.student_number,
      });

      setToast({
        open: true,
        message: "アカウントの紐付けが完了しました",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/");
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

  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  return { onSubmit, errorMessage, toast, closeToast };
};
