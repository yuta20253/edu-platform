"use client";

import {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { Goal } from "./types";

type EditGoalForm = {
  title: string;
  description: string;
  due_date: Date;
};

type Props = {
  goal: Goal;
  register: UseFormRegister<EditGoalForm>;
  errors: FieldErrors<EditGoalForm>;
  handleSubmit: UseFormHandleSubmit<EditGoalForm>;
  onSubmit: (data: EditGoalForm) => void;
  toast: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  closeToast: () => void;
};

export const Presenter = ({
  goal,
  register,
  errors,
  handleSubmit,
  onSubmit,
  toast,
  closeToast,
}: Props) => {
  return <>{goal.title}</>;
};
