"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { SchoolDetail } from "./types";

export const useSchoolDetail = (schoolId: number) => {
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<SchoolDetail>(`/api/admin/schools/${schoolId}`)
      .then((res) => setSchool(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [schoolId, router]);

  return { school };
};
