"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { AdminSchoolDetail } from "./types";

export const useAdminSchoolDetail = (schoolId: number) => {
  const [school, setSchool] = useState<AdminSchoolDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<AdminSchoolDetail>(`/api/admin/schools/${schoolId}`)
      .then((res) => setSchool(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [schoolId, router]);

  return { school };
};
