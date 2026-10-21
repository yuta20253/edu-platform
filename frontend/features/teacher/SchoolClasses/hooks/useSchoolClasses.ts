"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { GradeWithSchoolClasses } from "../types";

export const useSchoolClasses = () =>
  useApiQuery<GradeWithSchoolClasses[]>("/api/teacher/school-classes");
