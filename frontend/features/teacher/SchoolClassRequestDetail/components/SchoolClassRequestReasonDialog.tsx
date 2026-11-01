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

// バックエンドの SchoolClassRequest の reason の上限と揃える
const REASON_MAX_LENGTH = 10000;

// 却下の理由は申請者への通知に載るため必須。取消は申請者本人の操作なので任意
const texts = {
  reject: {
    title: "申請を却下",
    description:
      "却下すると元に戻せません。申請者に伝わるよう理由を入力してください。",
    reasonLabel: "却下理由",
    required: true,
    confirmLabel: "却下する",
  },
  cancel: {
    title: "申請を取消",
    description: "取り消すと元に戻せません。理由は空のままでも取り消せます。",
    reasonLabel: "取消理由",
    required: false,
    confirmLabel: "取り消す",
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

export const SchoolClassRequestReasonDialog = ({
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

  // 送信中に背景のクリックや Esc で閉じると、閉じた後に届いた結果のエラーが次に開いたときに残るため、閉じさせない
  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
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
          required={text.required}
          multiline
          rows={3}
          fullWidth
          {...register("reason", {
            validate: (value) =>
              !text.required ||
              value.trim() !== "" ||
              `${text.reasonLabel}を入力してください`,
            maxLength: {
              value: REASON_MAX_LENGTH,
              message: `${text.reasonLabel}は${REASON_MAX_LENGTH}文字以内で入力してください`,
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
