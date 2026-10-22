"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { Teacher } from "./types";

export const useTeacherDetail = (teacherId: number) =>
  useApiQuery<Teacher>(`/api/teacher/teachers/${teacherId}`);
