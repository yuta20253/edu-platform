"use client";

import { useForm } from "react-hook-form";
import type { CreateTeacherInput } from "../types";

const defaultValues: CreateTeacherInput = {
  name: "",
  name_kana: "",
  email: "",
  grade_id: 0,
  grade_scope: "own_grade",
  manage_other_teachers: false,
};

export const useCreateTeacherForm = () => {
  return useForm<CreateTeacherInput>({
    defaultValues,
  });
};
