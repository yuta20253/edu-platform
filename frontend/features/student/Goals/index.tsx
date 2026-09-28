"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useGetGoals, useDeleteGoal } from "./hooks";

export const Goals = () => {
  const { data, page, setPage, loading, error, refetch } = useGetGoals();

  const {
    deleteTarget,
    deleting,
    deleteError,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteGoal({ onDeleted: refetch });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data || error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        データの取得に失敗しました
      </Box>
    );
  }

  return (
    <Presenter
      data={data}
      page={page}
      onPageChange={setPage}
      onDeleteClick={openDeleteDialog}
      deleteTarget={deleteTarget}
      deleting={deleting}
      deleteError={deleteError}
      onDeleteDialogClose={closeDeleteDialog}
      onDeleteConfirm={confirmDelete}
    />
  );
};
