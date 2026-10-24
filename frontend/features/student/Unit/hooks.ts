"use client";

import { apiClient } from "@/libs/http/apiClient";
import { taskUnitPath } from "@/libs/path/taskUnitPath";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
