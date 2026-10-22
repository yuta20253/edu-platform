"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { SchoolClassDetailType } from "../types";

export const useSchoolClass = (schoolClassId: number) =>
  useApiQuery<SchoolClassDetailType>(
    `/api/teacher/school-classes/${schoolClassId}`,
  );
