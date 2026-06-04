"use client";

import { apiClient } from "@/libs/http/apiClient";
import { Box, CircularProgress } from "@mui/material";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Presenter } from "./Presenter";
import type { AdminsData, CreateAdminInput } from "./types";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export const AdminAdmins = () => {
  const [data, setData] = useState<AdminsData | null>(null);
  const [page, setPage] = useState(1);
  // 入力欄の値（query）と実際の検索値（debouncedQuery）を分ける
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const router = useRouter();

  // 一覧を取得する。検索やページ変更、作成後の再取得で使う
  const fetchAdmins = useCallback(() => {
    const params: Record<string, string> = { page: String(page) };
    if (debouncedQuery) {
      params.q = debouncedQuery;
    }

    apiClient
      .get<AdminsData>("/api/admin/admins", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, debouncedQuery, router]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // 検索入力を 300ms デバウンスして debouncedQuery に反映する
  const applyQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
        setPage(1);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      applyQuery.cancel();
    };
  }, [applyQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    applyQuery(value);
  };

  const handleAddClick = () => {
    setCreateErrors([]);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // 管理者を作成。成功でドロワーを閉じて一覧を再取得し、422 はエラーを表示する
  const handleCreate = async (input: CreateAdminInput) => {
    setCreating(true);
    setCreateErrors([]);

    try {
      await apiClient.post("/api/admin/admins", input);
      setDrawerOpen(false);
      setSnackbar({
        open: true,
        message: "管理者を追加しました",
        severity: "success",
      });
      fetchAdmins();
    } catch (err) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { status?: number; data?: { errors?: string[] } };
              }
            ).response
          : undefined;

      if (status?.status === 401) {
        router.push("/login");
        return;
      }

      const errors = status?.data?.errors;
      setCreateErrors(
        Array.isArray(errors) && errors.length > 0
          ? errors
          : ["管理者の追加に失敗しました"],
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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
