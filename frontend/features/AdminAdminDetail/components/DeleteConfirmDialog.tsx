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
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { colors } from "@/app/theme/colors";

type Props = {
  open: boolean;
  // 確認のために入力させる対象管理者のメールアドレス
  expectedEmail: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  // API（Rails）から返るエラー文言の配列
  deleteErrors: string[];
};

// 管理者削除の確認ダイアログ。
// 対象のメールアドレスを正確に入力するまで「削除する」ボタンを無効化する。
export const DeleteConfirmDialog = ({
  open,
  expectedEmail,
  onClose,
  onConfirm,
  deleting,
  deleteErrors,
}: Props) => {
  const [input, setInput] = useState("");

  // 開閉のたびに入力をリセットする
  useEffect(() => {
    if (!open) {
      setInput("");
    }
  }, [open]);

  const canDelete = input === expectedEmail && !deleting;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: colors.status.error, fontWeight: 700 }}>
        管理者を削除
      </DialogTitle>
      <DialogContent>
        {deleteErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
              {deleteErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </Stack>
          </Alert>
        )}

        <DialogContentText sx={{ mb: 2 }}>
          この操作は取り消せません。削除するには対象のメールアドレス
          <Typography component="span" fontWeight={700}>
            {` ${expectedEmail} `}
          </Typography>
          を入力してください。
        </DialogContentText>

        <TextField
          label="メールアドレスを入力"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={!canDelete}
          startIcon={
            deleting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );
};
