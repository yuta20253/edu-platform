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

// 却下もバックエンドではキャンセル(DELETE)だが、生徒に伝わる意味が違うため文言を分ける
const texts = {
  reject: {
    title: "面談の申請を却下",
    description:
      "却下すると元に戻せません。生徒に伝わるよう理由を入力してください。",
    reasonLabel: "却下理由",
    confirmLabel: "却下する",
  },
  cancel: {
    title: "面談をキャンセル",
    description:
      "キャンセルすると元に戻せません。生徒に伝わるよう理由を入力してください。",
    reasonLabel: "キャンセル理由",
    confirmLabel: "キャンセルする",
  },
} as const;

type Props = {
  open: boolean;
  kind: keyof typeof texts;
  onClose: () => void;
  // 成功時に true を返す。失敗時はダイアログを開いたまま error を表示する
  onConfirm: (reason: string) => Promise<boolean>;
  error: string;
};

type FormValues = { reason: string };

export const CancelInterviewDialog = ({
  open,
  kind,
  onClose,
  onConfirm,
  error,
}: Props) => {
  const text = texts[kind];
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
      <DialogTitle sx={{ fontWeight: 700 }}>{text.title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, mb: 2 }}>
          {text.description}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {error}
          </Alert>
        )}
        <TextField
          label={text.reasonLabel}
          multiline
          rows={3}
          fullWidth
          {...register("reason", {
            validate: (value) =>
              value.trim() !== "" || `${text.reasonLabel}を入力してください`,
            maxLength: {
              value: CANCEL_REASON_MAX_LENGTH,
              message: `${text.reasonLabel}は${CANCEL_REASON_MAX_LENGTH}文字以内で入力してください`,
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
          {text.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
