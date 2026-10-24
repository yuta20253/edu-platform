"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { Task } from "./types";

type Props = {
  taskId: number;
  goalId?: number;
};

export const TaskDetail = ({ goalId, taskId }: Props) => {
  const { data, error, refetch } = useApiQuery<Task>(
    `/api/student/tasks/${taskId}`,
  );

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(task) => <Presenter task={task} goalId={goalId} />}
    </AsyncBoundary>
  );
};
