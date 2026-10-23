"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useFetchPermissions } from "./hooks/useFetchPermissions";
import { usePermissionForm } from "./hooks/usePermissionForm";
import { useUpdatePermission } from "./hooks/useUpdatePermission";
import { Presenter } from "./Presenter";

export const Permissions = () => {
  const { data, page, setPage, error, refetch } = useFetchPermissions();

  const form = usePermissionForm();

  const {
    editingTeacher,
    updating,
    updateErrors,
    snackbar,
    handleEditClick,
    handleDrawerClose,
    handleUpdate,
    handleSnackbarClose,
  } = useUpdatePermission({ onUpdated: refetch, form });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(permissions) => (
        <Presenter
          data={permissions}
          page={page}
          onPageChange={setPage}
          editingTeacher={editingTeacher}
          onEditClick={handleEditClick}
          onDrawerClose={handleDrawerClose}
          onUpdate={handleUpdate}
          updating={updating}
          updateErrors={updateErrors}
          snackbar={snackbar}
          onSnackbarClose={handleSnackbarClose}
          form={form}
        />
      )}
    </AsyncBoundary>
  );
};
