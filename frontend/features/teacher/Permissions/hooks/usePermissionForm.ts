"use client";

import { useForm } from "react-hook-form";
import type { UpdatePermissionInput } from "../types";

const defaultValues: UpdatePermissionInput = {
  grade_scope: "own_grade",
  manage_other_teachers: false,
};

export const usePermissionForm = () => {
  return useForm<UpdatePermissionInput>({
    defaultValues,
  });
};
