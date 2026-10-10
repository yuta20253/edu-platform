"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useAdminSearch } from "./hooks/useAdminSearch";
import { useCreateAdmin } from "./hooks/useCreateAdmin";
import { useFetchAdmins } from "./hooks/useFetchAdmins";

export const Admins = () => {
  const { page, setPage, query, debouncedQuery, handleQueryChange } =
    useAdminSearch();

  // 一覧の取得はフックに切り出し。refetch は作成後の再取得に使う
  const { data, error, refetch } = useFetchAdmins({
    page,
    query: debouncedQuery,
  });

  const {
    drawerOpen,
    creating,
    createErrors,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
  } = useCreateAdmin({ onCreated: refetch });

  if (!data) {
    if (error) {
      return <ErrorState onRetry={refetch} />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
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
    />
  );
};
