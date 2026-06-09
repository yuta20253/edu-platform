"use client";

import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { Presenter } from "./Presenter";
import { useFetchAdminDetail } from "./hooks/useFetchAdminDetail";
import { useUpdateAdmin } from "./hooks/useUpdateAdmin";
import { useDeleteAdmin } from "./hooks/useDeleteAdmin";
import { usePasswordReset } from "./hooks/usePasswordReset";
import type { SnackbarState } from "./types";

type Props = {
  adminId: number;
  // ログイン中の管理者 ID（自己削除ガード用）。/me 取得失敗時は null。
  // null の場合は本人判定ができないため UI ガードは無効になるが、
  // 自己削除・最後の管理者の削除は Rails 側でも 422 で防がれる。
  currentAdminId: number | null;
};

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export const AdminAdminDetail = ({ adminId, currentAdminId }: Props) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);

  const { admin, setAdmin, fetchError, refetch } = useFetchAdminDetail(adminId);

  const { updating, updateErrors, handleUpdate } = useUpdateAdmin({
    adminId,
    onUpdated: (updated) => {
      // PATCH レスポンスの最新 admin で表示を更新する（再取得しない）
      setAdmin(updated);
      setSnackbar({
        open: true,
        message: "管理者を更新しました",
        severity: "success",
      });
    },
  });

  const {
    deleteDialogOpen,
    deleting,
    deleteErrors,
    handleDeleteClick,
    handleDeleteDialogClose,
    handleDeleteConfirm,
  } = useDeleteAdmin({ adminId });

  const { resettingPassword, handlePasswordReset } = usePasswordReset({
    adminId,
    email: admin?.email ?? "",
    onSuccess: () =>
      setSnackbar({
        open: true,
        message: "パスワード再設定メールを送信しました",
        severity: "success",
      }),
    onError: () =>
      setSnackbar({
        open: true,
        message: "パスワード再設定メールの送信に失敗しました",
        severity: "error",
      }),
  });

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (fetchError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              再試行
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  if (!admin) {
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
      admin={admin}
      isSelf={currentAdminId === admin.id}
      onUpdate={handleUpdate}
      updating={updating}
      updateErrors={updateErrors}
      onPasswordReset={handlePasswordReset}
      resettingPassword={resettingPassword}
      deleteDialogOpen={deleteDialogOpen}
      onDeleteClick={handleDeleteClick}
      onDeleteDialogClose={handleDeleteDialogClose}
      onDeleteConfirm={handleDeleteConfirm}
      deleting={deleting}
      deleteErrors={deleteErrors}
      snackbar={snackbar}
      onSnackbarClose={handleSnackbarClose}
    />
  );
};
