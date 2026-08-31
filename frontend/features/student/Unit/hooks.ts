"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UnitType } from "./types";

type Props = {
  taskId: number;
  unitId: number;
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
