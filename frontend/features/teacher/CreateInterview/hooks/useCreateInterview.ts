"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateInterviewForm } from "../types";

export const useCreateInterview = () => {
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const onSubmit = async (data: CreateInterviewForm) => {
    setSubmitError("");

    try {
      await apiClient.post("/api/teacher/interview-requests", data);
      show({ message: "面談を申請しました", severity: "success" });
      router.push("/teacher/interviews");
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      setSubmitError(buildErrorMessage(errors, "面談の申請に失敗しました"));
    }
  };

  return { onSubmit, submitError };
};
