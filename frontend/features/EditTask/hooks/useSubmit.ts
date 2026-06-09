"use client";

import { apiClient } from "@/libs/http/apiClient";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { EditTaskForm } from "../types";

type ToastType = "success" | "error";

type Props = {
  goalId?: number;
  taskId: number;
};

export const useSubmit = ({ goalId, taskId }: Props) => {
  const router = useRouter();

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as ToastType,
  });

  const closeToast = () =>
    setToast((prev) => ({
      ...prev,
      open: false,
    }));

  const onSubmit: SubmitHandler<EditTaskForm> = async (data) => {
    try {
      const payload = {
        ...data,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      };

      await apiClient.patch(`/api/student/tasks/${taskId}`, payload);

      setToast({
        open: true,
        message: "タスクを更新しました",
        severity: "success",
      });

      const backHref = goalId
        ? `/goals/${goalId}/tasks/${taskId}`
        : `/tasks/${taskId}`;

      setTimeout(() => {
        router.push(backHref);
      }, 1000);
    } catch (error) {
      console.error(error);

      setToast({
        open: true,
        message: "目標の更新に失敗しました",
        severity: "error",
      });
    }
  };

  return { onSubmit, toast, closeToast };
};
