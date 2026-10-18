"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

const CANCEL_REASON_MAX_LENGTH = 2000;

type Props = {
  open: boolean;
  onClose: () => void;
  // 成功時に true を返す。失敗時はダイアログを開いたまま error を表示する
  onConfirm: (reason: string) => Promise<boolean>;
  error: string;
};

type FormValues = { reason: string };

export const CancelInterviewDialog = ({
  open,
  onClose,
  onConfirm,
  error,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { reason: "" } });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async ({ reason }) => {
    const succeeded = await onConfirm(reason.trim());
    if (succeeded) onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>面談をキャンセル</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, mb: 2 }}>
          キャンセルすると元に戻せません。先生に伝わるよう理由を入力してください。
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {error}
          </Alert>
        )}
        <TextField
          label="キャンセル理由"
          multiline
          rows={3}
          fullWidth
          {...register("reason", {
            validate: (value) =>
              value.trim() !== "" || "キャンセル理由を入力してください",
            maxLength: {
              value: CANCEL_REASON_MAX_LENGTH,
              message: `キャンセル理由は${CANCEL_REASON_MAX_LENGTH}文字以内で入力してください`,
            },
          })}
          error={!!errors.reason}
          helperText={errors.reason?.message}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          戻る
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={submit}
          disabled={isSubmitting}
        >
          キャンセルする
        </Button>
      </DialogActions>
    </Dialog>
  );
};
