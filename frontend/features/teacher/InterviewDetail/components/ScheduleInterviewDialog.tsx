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
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  open: boolean;
  onClose: () => void;
  // 成功時に true を返す。失敗時はダイアログを開いたまま error を表示する
  onConfirm: (scheduledAt: Date) => Promise<boolean>;
  error: string;
};

type FormValues = { scheduledAt: Date | null };

export const ScheduleInterviewDialog = ({
  open,
  onClose,
  onConfirm,
  error,
}: Props) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { scheduledAt: null } });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async ({ scheduledAt }) => {
    if (!scheduledAt) return;
    const succeeded = await onConfirm(scheduledAt);
    if (succeeded) onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>面談の日程を確定</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, mb: 2 }}>
          確定すると生徒に通知されます。
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {error}
          </Alert>
        )}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <Controller
            name="scheduledAt"
            control={control}
            rules={{
              validate: (value) => {
                if (!value || !isValid(value))
                  return "予定日時を入力してください";
                if (value <= new Date())
                  return "予定日時は現在より後の日時を指定してください";
                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <DateTimePicker
                label="予定日時"
                format="yyyy/MM/dd HH:mm"
                value={field.value}
                onChange={(date) => field.onChange(date)}
                minDateTime={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          戻る
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSubmitting}>
          確定する
        </Button>
      </DialogActions>
    </Dialog>
  );
};
