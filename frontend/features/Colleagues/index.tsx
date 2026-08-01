"use client";

import { Box, CircularProgress } from "@mui/material";
import { useFetchColleagues } from "./hooks/useFetchColleagues";
import { Presenter } from "./Presenter";
import { useCreateCollegue } from "./hooks/useCreateCollegue";

export const Colleagues = () => {
  const { data, page, setPage, refetch } = useFetchColleagues();

  const {
    drawerOpen,
    creating,
    createErrors,
    snackbar,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
    handleSnackbarClose,
  } = useCreateCollegue({ onCreated: refetch });

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
    />
  );
};
