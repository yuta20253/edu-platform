"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CreateAdminInput } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateAdminInput) => void;
  creating: boolean;
  // API（Rails）から返るバリデーションエラー文言の配列
  createErrors: string[];
};

export const AdminCreateDrawer = ({
  open,
  onClose,
  onCreate,
  creating,
  createErrors,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminInput>({
    defaultValues: { name: "", email: "" },
  });

  // ドロワーを閉じたらフォームを初期化する
  useEffect(() => {
    if (!open) {
      reset({ name: "", email: "" });
    }
  }, [open, reset]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100%" } } }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onCreate)}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            管理者を追加
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mt: 0.5 }}>
            招待メールが送信され、本人がパスワードを設定します。
          </Typography>
        </Box>

        {/* 入力エリア */}
        <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
          {createErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                {createErrors.map((message) => (
                  <li key={message}>{message}</li>
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
                  value: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                  message: "メールアドレスの形式が正しくありません",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Stack>
        </Box>

        {/* フッター */}
        <Box
          sx={{
            p: 3,
            borderTop: `1px solid ${colors.border.light}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button onClick={onClose} disabled={creating} color="inherit">
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={creating}
            startIcon={
              creating ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            追加
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
