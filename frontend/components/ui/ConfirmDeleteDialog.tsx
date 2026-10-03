"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { colors } from "@/app/theme/colors";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  // 確認のためユーザーに入力させる文字列（対象のメールアドレス、名前など）
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  errors: string[];
  confirmLabel?: string;
  inputLabel?: string;
};

// 型確認付きの削除確認ダイアログ。AdminDetail/components/DeleteConfirmDialog
// をロール非依存に汎用化したもの。confirmTextを正確に入力するまで
// 「削除する」ボタンを無効化する。
export const ConfirmDeleteDialog = ({
  open,
  title,
  description,
  confirmText,
  onClose,
  onConfirm,
  loading,
  errors,
  confirmLabel = "削除する",
  inputLabel = "入力して確認",
}: Props) => {
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  // confirmTextが空文字だと未入力のinputと一致してしまい、確認なしで
  // 削除できてしまうため、空文字のconfirmTextは常に無効として扱う。
  const canConfirm = confirmText !== "" && input === confirmText && !loading;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: colors.status.error, fontWeight: 700 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
              {errors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </Stack>
          </Alert>
        )}

        <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>

        <TextField
          label={inputLabel}
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={!canConfirm}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
