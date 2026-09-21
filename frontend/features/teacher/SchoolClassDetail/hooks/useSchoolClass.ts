"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { SchoolClassDetailType } from "../types";

export const useSchoolClass = (schoolClassId: number) => {
  const [schoolClass, setSchoolClass] = useState<SchoolClassDetailType | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<SchoolClassDetailType>(
        `/api/teacher/school-classes/${schoolClassId}`,
      )
      .then((res) => setSchoolClass(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setSchoolClass(null);
      })
      .finally(() => setLoading(false));
  }, [router, schoolClassId]);

  return { schoolClass, loading, error };
};
