"use client";

import { useForm } from "react-hook-form";
import type { CreateStudentInput } from "../types";

const defaultValues: CreateStudentInput = {
  name: "",
  name_kana: "",
  email: "",
  grade_id: 0,
  school_class_id: 0,
};

export const useCreateStudentForm = () => {
  return useForm<CreateStudentInput>({
    defaultValues,
  });
};
