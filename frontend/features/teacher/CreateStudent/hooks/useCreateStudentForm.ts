"use client";

import { useForm } from "react-hook-form";
import type { CreateStudentInput } from "../types";

const defaultValues: CreateStudentInput = {
  name: "",
  name_kana: "",
  email: "",
  grade_id: "",
  school_class_id: "",
};

export const useCreateStudentForm = () => {
  return useForm<CreateStudentInput>({
    defaultValues,
  });
};
