"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Teacher } from "./types";

export const useTeacherDetail = (teacherId: number) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Teacher>(`/api/teacher/teachers/${teacherId}`)
      .then((res) => setTeacher(res.data))
      .catch((err) => {
        const status = err.response?.status;

        if (status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setTeacher(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [teacherId, router]);

  return { teacher, loading, error };
};
