"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  // 成功時に true を返す。失敗時はダイアログを開いたまま error を表示する
  onConfirm: () => Promise<boolean>;
  error: string;
};

export const CompleteInterviewDialog = ({
  open,
  onClose,
  onConfirm,
  error,
}: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const succeeded = await onConfirm();
    setSubmitting(false);
    if (succeeded) onClose();
  };

  // 送信中に背景のクリックや Esc で閉じると、閉じた後に届いた結果のエラーが次に開いたときに残るため、閉じさせない
  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>面談を完了にする</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {error}
          </Alert>
        )}
        <DialogContentText sx={{ fontSize: 14 }}>
          面談を完了にしますか？完了にするとメッセージのやり取りはできなくなります。
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          戻る
        </Button>
        <Button variant="contained" onClick={submit} disabled={submitting}>
          完了にする
        </Button>
      </DialogActions>
    </Dialog>
  );
};
