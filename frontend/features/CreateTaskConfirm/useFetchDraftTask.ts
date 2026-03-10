'use client';

import { Dispatch, SetStateAction, useEffect, useState } from "react";
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

type Props = {
  draftTaskId: number;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export const useFetchDraftTask = ({draftTaskId, setIsLoading}: Props) => {
  const [draftTask, setDraftTask] = useState<DraftTaskType | null>(null);

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

  return { draftTask };
};
