"use client";

import { Box, CircularProgress } from "@mui/material";
import { useFetchTeachers } from "./hooks/useFetchTeachers";
import { Presenter } from "./Presenter";
import { useCreateTeacher } from "./hooks/useCreateTeacher";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { useCreateTeacherForm } from "./hooks/useCreateTeacherForm";

export const Teachers = () => {
  const { data, page, setPage, refetch } = useFetchTeachers();

  const form = useCreateTeacherForm();

  const {
    drawerOpen,
    creating,
    createErrors,
    snackbar,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
    handleSnackbarClose,
  } = useCreateTeacher({ onCreated: refetch, form });

  const gradeOptions = useGradeOptions(drawerOpen);

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
      drawerOpen={drawerOpen}
      onAddClick={handleAddClick}
      onDrawerClose={handleDrawerClose}
      onCreate={handleCreate}
      creating={creating}
      createErrors={createErrors}
      snackbar={snackbar}
      onSnackbarClose={handleSnackbarClose}
      form={form}
      gradeOptions={gradeOptions}
    />
  );
};
