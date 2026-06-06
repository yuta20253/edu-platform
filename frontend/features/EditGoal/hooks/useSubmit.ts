"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";

type ToastType = "success" | "error";

type EditGoalForm = {
  title: string;
  description: string;
  due_date: Date;
};

type Props = {
  goalId: number;
};

export const useSubmit = ({ goalId }: Props) => {
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

  const onSubmit: SubmitHandler<EditGoalForm> = async (data) => {
    try {
      await apiClient.patch(`/api/student/goals/${goalId}`, data);

      setToast({
        open: true,
        message: "目標を更新しました",
        severity: "success",
      });

      setTimeout(() => {
        router.push(`/goals/${goalId}`);
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
