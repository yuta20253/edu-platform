"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
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

  return (
    <AsyncBoundary
      data={data}
      error={error}
      onRetry={refetch}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(admins) => (
        <Presenter
          data={admins}
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
      )}
    </AsyncBoundary>
  );
};
