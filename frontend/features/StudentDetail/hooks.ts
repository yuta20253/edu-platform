"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { Student } from "./types";

export const useStudent = (studentId: number) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<Student>(`/api/teacher/students/${studentId}`)
      .then((res) => setStudent(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, [router, studentId]);

  return { student, loading, error };
};
