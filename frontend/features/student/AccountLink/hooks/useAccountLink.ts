"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { AccountLinkForm, AccountLinkPreview } from "../types";
import { normalizeStudentNumber } from "../normalizeStudentNumber";

type Step = "input" | "confirm";

export const useAccountLink = () => {
  const router = useRouter();
  const { show } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [studentNumber, setStudentNumber] = useState("");
  const [preview, setPreview] = useState<AccountLinkPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const onPreviewSubmit: SubmitHandler<AccountLinkForm> = async (data) => {
    setPreviewError("");
    const normalized = normalizeStudentNumber(data.student_number);

    try {
      const res = await apiClient.post<AccountLinkPreview>(
        "/api/student/account-link/preview",
        { student_number: normalized },
      );

      setStudentNumber(normalized);
      setPreview(res.data);
      setStep("confirm");
    } catch (error) {
      const { status, errors } = extractApiError(error);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setPreviewError(errors?.[0] ?? "確認に失敗しました");
    }
  };

  const onBack = () => {
    setStep("input");
    setPreview(null);
    setConfirmError("");
  };

  const onConfirm = async () => {
    setConfirmError("");
    setConfirming(true);

    try {
      await apiClient.post("/api/student/account-link", {
        student_number: studentNumber,
      });

      setIsLinked(true);
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

      setConfirmError(errors?.[0] ?? "アカウントの紐付けに失敗しました");
    } finally {
      setConfirming(false);
    }
  };

  return {
    step,
    onPreviewSubmit,
    previewError,
    preview,
    onBack,
    onConfirm,
    confirmError,
    confirming,
    isLinked,
  };
};
