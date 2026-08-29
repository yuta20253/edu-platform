"use client";

import { Box, CircularProgress } from "@mui/material";
import { useFetchTeacherPermissions } from "./hooks/useFetchTeacherPermissions";
import { usePermissionForm } from "./hooks/usePermissionForm";
import { useUpdatePermission } from "./hooks/useUpdatePermission";
import { Presenter } from "./Presenter";

export const TeacherPermissions = () => {
  const { data, page, setPage, error, refetch } = useFetchTeacherPermissions();

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

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        データの取得に失敗しました
      </Box>
    );
  }

  if (!data) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      data={data}
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
  );
};
