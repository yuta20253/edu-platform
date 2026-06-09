"use client";

import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { colors } from "@/app/theme/colors";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import type { AdminDetail, SnackbarState, UpdateAdminInput } from "./types";

type Props = {
  admin: AdminDetail;
  // 表示中の管理者がログイン中の本人かどうか（自己削除ガード用）
  isSelf: boolean;

  // 編集（更新）。成功すると true を返し、編集モードを抜ける。
  onUpdate: (input: UpdateAdminInput) => Promise<boolean>;
  updating: boolean;
  updateErrors: string[];

  // パスワードリセット
  onPasswordReset: () => void;
  resettingPassword: boolean;

  // 削除フロー
  deleteDialogOpen: boolean;
  onDeleteClick: () => void;
  onDeleteDialogClose: () => void;
  onDeleteConfirm: () => void;
  deleting: boolean;
  deleteErrors: string[];

  // 完了スナックバー
  snackbar: SnackbarState;
  onSnackbarClose: () => void;
};

export const Presenter = ({
  admin,
  isSelf,
  onUpdate,
  updating,
  updateErrors,
  onPasswordReset,
  resettingPassword,
  deleteDialogOpen,
  onDeleteClick,
  onDeleteDialogClose,
  onDeleteConfirm,
  deleting,
  deleteErrors,
  snackbar,
  onSnackbarClose,
}: Props) => {
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAdminInput>({
    defaultValues: { name: admin.name, email: admin.email },
  });

  const handleEditClick = () => {
    reset({ name: admin.name, email: admin.email });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async (input: UpdateAdminInput) => {
    const success = await onUpdate(input);
    if (success) {
      setEditing(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* パンくずナビ */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href="/admin/admins"
          style={{ color: colors.brand.primary, textDecoration: "none" }}
        >
          管理者一覧
        </Link>
        <Typography color="text.primary">{admin.name}</Typography>
      </Breadcrumbs>

      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        {admin.name}
      </Typography>

      <Grid container spacing={3}>
        {/* 左カラム（65%）：プロフィール・編集 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            elevation={0}
            sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  プロフィール
                </Typography>
                {!editing && (
                  <Button variant="outlined" onClick={handleEditClick}>
                    編集
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {editing ? (
                <Box component="form" onSubmit={handleSubmit(handleSave)}>
                  {updateErrors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                        {updateErrors.map((message, index) => (
                          <li key={index}>{message}</li>
                        ))}
                      </Stack>
                    </Alert>
                  )}

                  <Stack spacing={3}>
                    <TextField
                      label="名前"
                      fullWidth
                      required
                      {...register("name", {
                        required: "名前を入力してください",
                      })}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                    <TextField
                      label="メールアドレス"
                      type="email"
                      fullWidth
                      required
                      {...register("email", {
                        required: "メールアドレスを入力してください",
                        pattern: {
                          value: /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                          message: "メールアドレスの形式が正しくありません",
                        },
                      })}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  </Stack>

                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1.5,
                    }}
                  >
                    <Button
                      onClick={handleCancel}
                      disabled={updating}
                      color="inherit"
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={updating}
                      startIcon={
                        updating ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : null
                      }
                    >
                      保存
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.muted, mb: 0.5 }}
                    >
                      名前
                    </Typography>
                    <Typography variant="body1">{admin.name}</Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.muted, mb: 0.5 }}
                    >
                      メールアドレス
                    </Typography>
                    <Typography variant="body1">{admin.email}</Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.muted, mb: 0.5 }}
                    >
                      登録日
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(admin.created_at), "yyyy/MM/dd")}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {!editing && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.muted, mb: 1 }}
                    >
                      パスワード
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={onPasswordReset}
                      disabled={resettingPassword}
                      startIcon={
                        resettingPassword ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : null
                      }
                    >
                      パスワードリセット
                    </Button>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: colors.text.muted, mt: 1 }}
                    >
                      パスワード再設定メールを送信します。
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 右カラム（35%）：アクティビティログ・危険操作 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* アクティビティログ（空状態のみ） */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${colors.border.light}`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  アクティビティログ
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    py: 4,
                  }}
                >
                  <HistoryIcon
                    sx={{ fontSize: 40, color: colors.text.muted }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: colors.text.secondary }}
                  >
                    アクティビティはまだありません
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* 危険操作 */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${colors.status.error}`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: colors.status.error, mb: 1 }}
                >
                  危険操作
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.secondary, mb: 2 }}
                >
                  この管理者を削除します。この操作は取り消せません。
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={onDeleteClick}
                  disabled={isSelf}
                >
                  この管理者を削除
                </Button>
                {isSelf && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: colors.text.muted,
                      mt: 1,
                    }}
                  >
                    自分自身は削除できません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        expectedEmail={admin.email}
        onClose={onDeleteDialogClose}
        onConfirm={onDeleteConfirm}
        deleting={deleting}
        deleteErrors={deleteErrors}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
