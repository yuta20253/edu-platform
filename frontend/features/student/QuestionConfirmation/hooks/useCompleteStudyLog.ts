"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useEffect, useRef } from "react";

type Props = {
  taskId: number;
  unitId: number;
  studyLogId?: number;
};

export const useCompleteStudyLog = ({ taskId, unitId, studyLogId }: Props) => {
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!studyLogId || completedRef.current) return;

    completedRef.current = true;

    apiClient
      .patch(
        `/api/student/tasks/${taskId}/units/${unitId}/study_logs/${studyLogId}`,
      )
      .then(() => apiClient.patch(`/api/student/tasks/${taskId}/submission`))
      .catch((error) => {
        console.error(error);
      });
  }, [taskId, unitId, studyLogId]);
};
