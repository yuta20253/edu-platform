"use client";

import { Box, CircularProgress } from "@mui/material";
import { useFetchColleagues } from "./hooks/useFetchColleagues";
import { Presenter } from "./Presenter";
import { useCreateColleague } from "./hooks/useCreateColleague";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { useCreateTeacherForm } from "./hooks/useCreateTeacherForm";

export const Colleagues = () => {
  const { data, page, setPage, refetch } = useFetchColleagues();

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
  } = useCreateColleague({ onCreated: refetch, form });

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
