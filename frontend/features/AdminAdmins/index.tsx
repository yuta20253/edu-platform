"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useAdminSearch } from "./hooks/useAdminSearch";
import { useCreateAdmin } from "./hooks/useCreateAdmin";
import { useFetchAdmins } from "./hooks/useFetchAdmins";

export const AdminAdmins = () => {
  const { page, setPage, query, debouncedQuery, handleQueryChange } =
    useAdminSearch();

  // 一覧の取得はフックに切り出し。refetch は作成後の再取得に使う
  const { data, refetch } = useFetchAdmins({ page, query: debouncedQuery });

  const {
    drawerOpen,
    creating,
    createErrors,
    snackbar,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
    handleSnackbarClose,
  } = useCreateAdmin({ onCreated: refetch });

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
      query={query}
      onQueryChange={handleQueryChange}
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
