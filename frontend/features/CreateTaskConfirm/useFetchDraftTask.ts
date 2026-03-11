'use client';

import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";

type CourseType = {
  id: number;
  level_number: number;
  level_name: string;
};

type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: CourseType;
};

export type DraftTaskType = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  priority: string;
  due_date: string | null;
  units: UnitType[];
};

export const useFetchDraftTask = (draftTaskId: number) => {
  const [draftTask, setDraftTask] = useState<DraftTaskType | null>(null);
   const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!draftTaskId) return;
    const fetchDraftTask = async () => {
        try {
          setIsLoading(true)

          const res = await apiClient.get(`/api/student/draft-tasks/${draftTaskId}`);
          setDraftTask(res.data);

          setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    };
    fetchDraftTask();
  }, [draftTaskId, setIsLoading]);

  return { draftTask, isLoading };
};
