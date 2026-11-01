"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useFetchPermissions } from "./hooks/useFetchPermissions";
import { useUpdatePermission } from "./hooks/useUpdatePermission";
import { Presenter } from "./Presenter";

export const Permissions = () => {
  const { data, page, setPage, error, refetch } = useFetchPermissions();

  const {
    editingTeacher,
    formKey,
    updating,
    updateErrors,
    snackbar,
    handleEditClick,
    handleDrawerClose,
    handleUpdate,
    handleSnackbarClose,
  } = useUpdatePermission({ onUpdated: refetch });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(permissions) => (
        <Presenter
          data={permissions}
          page={page}
          onPageChange={setPage}
          editingTeacher={editingTeacher}
          formKey={formKey}
          onEditClick={handleEditClick}
          onDrawerClose={handleDrawerClose}
          onUpdate={handleUpdate}
          updating={updating}
          updateErrors={updateErrors}
          snackbar={snackbar}
          onSnackbarClose={handleSnackbarClose}
        />
      )}
    </AsyncBoundary>
  );
};
