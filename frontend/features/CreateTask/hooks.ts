"use client";

import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CreateTaskForm, Props } from "./types";

export const useSubmit = ({ selectedUnitIds, courses, goalId }: Props) => {
  const router = useRouter();
  const onSubmit: SubmitHandler<CreateTaskForm> = async (data) => {
    const payload = {
      form: {
        ...data,
        task: {
          ...data.task,
          unit_ids: selectedUnitIds,
        },
      },
      courses: courses,
    };
    sessionStorage.setItem("CreateTaskData", JSON.stringify(payload));
    router.push(`/goals/${goalId}/tasks/confirm`);
  };

  return { onSubmit };
};
