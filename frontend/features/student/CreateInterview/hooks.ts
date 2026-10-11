"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateInterviewForm, Teacher } from "./types";

// 申請先として選べる、自分の学級の担当教員一覧
export const useGetTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<{ teachers: Teacher[] }>("/api/student/teachers")
      .then((res) => setTeachers(res.data.teachers))
      .catch((err) => {
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { teachers, loading, error };
};

export const useCreateInterview = () => {
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const onSubmit = async (data: CreateInterviewForm) => {
    setSubmitError("");

    try {
      await apiClient.post("/api/student/interview-requests", data);
      show({ message: "面談を申請しました", severity: "success" });
      router.push("/interviews");
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
