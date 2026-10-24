"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useGetGoals, useDeleteGoal } from "./hooks";

export const Goals = () => {
  const { data, page, setPage, error, refetch } = useGetGoals();

  const {
    deleteTarget,
    deleting,
    deleteError,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteGoal({ onDeleted: refetch });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(goals) => (
        <Presenter
          data={goals}
          page={page}
          onPageChange={setPage}
          onDeleteClick={openDeleteDialog}
          deleteTarget={deleteTarget}
          deleting={deleting}
          deleteError={deleteError}
          onDeleteDialogClose={closeDeleteDialog}
          onDeleteConfirm={confirmDelete}
        />
      )}
    </AsyncBoundary>
  );
};
