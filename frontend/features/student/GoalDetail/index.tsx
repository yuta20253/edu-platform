"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDeleteGoal } from "./hooks";
import { Presenter } from "./Presenter";
import { Goal } from "./types";

type Props = {
  goalId: number;
};

export const GoalDetail = ({ goalId }: Props) => {
  const { data, error, refetch } = useApiQuery<Goal>(
    `/api/student/goals/${goalId}`,
  );

  const {
    deleteDialogOpen,
    deleting,
    deleteError,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteGoal({ goalId });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(goal) => (
        <Presenter
          goal={goal}
          deleteDialogOpen={deleteDialogOpen}
          deleting={deleting}
          deleteError={deleteError}
          onDeleteClick={openDeleteDialog}
          onDeleteDialogClose={closeDeleteDialog}
          onDeleteConfirm={confirmDelete}
        />
      )}
    </AsyncBoundary>
  );
};
