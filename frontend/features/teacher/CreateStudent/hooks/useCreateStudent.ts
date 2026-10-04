"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreateStudentInput } from "../types";

export const useCreateStudent = () => {
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleCreate = async (input: CreateStudentInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post("/api/teacher/students", { user: input });
      router.push("/teacher/students");
    } catch (err) {
      const { status, errors } = extractApiError(err);

      if (status === 401) {
        router.push("/login");
        return;
      }

      setCreateErrors(errors ?? ["生徒の新規作成に失敗しました"]);
    } finally {
      setCreating(false);
    }
  };

  return { creating, createErrors, handleCreate };
};
