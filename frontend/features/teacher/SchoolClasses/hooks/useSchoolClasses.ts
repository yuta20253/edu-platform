"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GradeWithSchoolClasses } from "../types";

export const useSchoolClasses = () => {
  const [data, setData] = useState<GradeWithSchoolClasses[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    apiClient
      .get<GradeWithSchoolClasses[]>("/api/teacher/school-classes")
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { data, loading };
};
