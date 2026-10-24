"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStartStudyLog } from "./hooks";
import { Presenter } from "./Presenter";
import { UnitType } from "./types";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
};

export const Unit = ({ goalId, taskId, unitId }: Props) => {
  const { data, error, refetch } = useApiQuery<UnitType>(
    `/api/student/tasks/${taskId}/units/${unitId}`,
  );
  const { handleStart, isStarting } = useStartStudyLog({
    taskId,
    unitId,
    goalId,
  });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(unit) => (
        <Presenter
          goalId={goalId}
          taskId={taskId}
          unitId={unitId}
          unit={unit}
          onStart={handleStart}
          isStarting={isStarting}
        />
      )}
    </AsyncBoundary>
  );
};
