"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { schoolClassRequestActionLabel } from "@/constants/school_class_request";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateSchoolClassRequestForm } from "../types";

// 種別を切り替える前に入力した値が残っていても、その種別で使う項目だけを送る
const buildPayload = ({
  action,
  grade_id,
  school_class_id,
  name,
}: CreateSchoolClassRequestForm) => {
  switch (action) {
    case "creation":
      return { action, grade_id, name };
    case "modification":
      return { action, grade_id, school_class_id, name };
    case "deletion":
      return { action, grade_id, school_class_id };
  }
};

export const useCreateSchoolClassRequest = () => {
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const onSubmit = async (data: CreateSchoolClassRequestForm) => {
    setSubmitError("");

    try {
      await apiClient.post(
        "/api/teacher/school-class-requests",
        buildPayload(data),
      );
      show({
        message: `学級の${schoolClassRequestActionLabel[data.action]}を申請しました`,
        severity: "success",
      });
      router.push("/teacher/school-class-requests");
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      setSubmitError(buildErrorMessage(errors, "学級の申請に失敗しました"));
    }
  };

  return { onSubmit, submitError };
};
