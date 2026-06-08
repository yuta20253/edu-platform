"use client";

import { Box, CircularProgress } from "@mui/material";
import { useState } from "react";
import { Presenter } from "./Presenter";
import { useFetchAdminDetail } from "./hooks/useFetchAdminDetail";
import { useUpdateAdmin } from "./hooks/useUpdateAdmin";
import { useDeleteAdmin } from "./hooks/useDeleteAdmin";
import { usePasswordReset } from "./hooks/usePasswordReset";
import type { SnackbarState } from "./types";

type Props = {
  adminId: number;
  // ログイン中の管理者 ID（自己削除ガード用）。未取得時は null。
  currentAdminId: number | null;
};

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export const AdminAdminDetail = ({ adminId, currentAdminId }: Props) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);

  const { admin, refetch } = useFetchAdminDetail(adminId);

  const { updating, updateErrors, handleUpdate } = useUpdateAdmin({
    adminId,
    onUpdated: () => {
      setSnackbar({
        open: true,
        message: "管理者を更新しました",
        severity: "success",
      });
      refetch();
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
