"use client";

import { apiClient } from "@/libs/http/apiClient";
import { taskUnitPath } from "@/libs/path/taskUnitPath";
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

type StartStudyLogProps = {
  taskId: number;
  unitId: number;
  goalId?: number;
};

export const useStartStudyLog = ({
  taskId,
  unitId,
  goalId,
}: StartStudyLogProps) => {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const handleStart = async () => {
    if (isStarting) return;

    const questionsPath = `${taskUnitPath(taskId, unitId, goalId)}/questions`;

    try {
      setIsStarting(true);

      const res = await apiClient.post<{ study_log_id: number }>(
        `/api/student/tasks/${taskId}/units/${unitId}/study_logs`,
      );

      router.push(`${questionsPath}?study_log_id=${res.data.study_log_id}`);
    } catch (error) {
      console.error(error);
      router.push(questionsPath);
    } finally {
      setIsStarting(false);
    }
  };

  return { handleStart, isStarting };
};
