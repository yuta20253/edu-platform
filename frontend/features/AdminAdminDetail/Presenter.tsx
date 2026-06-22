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
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import type { Prefecture } from "@/types/common/prefecture";
import { colors } from "@/app/theme/colors";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { ProfileEditForm } from "./components/ProfileEditForm";
import type { AdminDetail, SnackbarState, UpdateAdminInput } from "./types";

const GENDER_LABELS: Record<string, string> = {
  male: "男",
  female: "女",
  other: "その他",
};

// 読み取り表示の 1 項目。未設定は「未設定」と表示する。
const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography variant="body2" sx={{ color: colors.text.muted, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body1">{value || "未設定"}</Typography>
  </Box>
);

type Props = {
  admin: AdminDetail;
  // 住所カスケード（都道府県プルダウン）用の都道府県一覧
  prefectures: Prefecture[];
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
  prefectures,
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

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  // 編集フォームから呼ばれる。成功したら編集モードを抜ける。
  const handleUpdate = async (input: UpdateAdminInput) => {
    const success = await onUpdate(input);
    if (success) {
      setEditing(false);
    }
    return success;
  };

  const personalInfo = admin.user_personal_info;
  const address = admin.address;
  const addressText = address
    ? [
        address.prefecture?.name ?? "",
        address.city,
        address.town,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

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
                <ProfileEditForm
                  admin={admin}
                  prefectures={prefectures}
                  onUpdate={handleUpdate}
                  onCancel={handleCancel}
                  updating={updating}
                  updateErrors={updateErrors}
                />
              ) : (
                <Stack spacing={3}>
                  <ReadOnlyField label="名前" value={admin.name} />
                  <ReadOnlyField
                    label="氏名カナ"
                    value={admin.name_kana ?? ""}
                  />
                  <ReadOnlyField label="メールアドレス" value={admin.email} />
                  <ReadOnlyField
                    label="電話番号"
                    value={personalInfo?.phone_number ?? ""}
                  />
                  <ReadOnlyField
                    label="生年月日"
                    value={personalInfo?.birthday ?? ""}
                  />
                  <ReadOnlyField
                    label="性別"
                    value={
                      personalInfo?.gender
                        ? (GENDER_LABELS[personalInfo.gender] ??
                          personalInfo.gender)
                        : ""
                    }
                  />
                  <ReadOnlyField label="住所" value={addressText} />
                  <ReadOnlyField
                    label="登録日"
                    value={format(new Date(admin.created_at), "yyyy/MM/dd")}
                  />
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
