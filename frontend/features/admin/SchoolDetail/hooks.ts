"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import type { SchoolDetail, SchoolDetailData } from "./types";

export const useSchoolDetail = (schoolId: number) => {
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setError(false);
    apiClient
      .get<SchoolDetailData>(`/api/admin/schools/${schoolId}`)
      .then((res) => setSchool(res.data.school))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      });
  }, [schoolId, router, reloadKey]);

  const retry = () => setReloadKey((prev) => prev + 1);

  return { school, error, retry };
};
