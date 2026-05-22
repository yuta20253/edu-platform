"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  taskId: number;
  unitId: number;
};

type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: {
    id: number;
    level_number: number;
    level_name: string;
  };
};

export const useGetUnit = ({ taskId, unitId }: Props) => {
  const [unit, setUnit] = useState<UnitType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(false);

    apiClient
      .get<UnitType>(`/api/student/tasks/${taskId}/units/${unitId}`)
      .then((res) => setUnit(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }

        setError(true);
        setUnit(null);
      })
      .finally(() => setLoading(false));
  }, [router, taskId, unitId]);

  return { unit, loading, error };
};
