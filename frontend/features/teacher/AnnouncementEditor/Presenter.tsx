"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { TargetPicker } from "./components/TargetPicker";
import {
  DEFAULT_ANNOUNCEMENT_FORM_VALUES,
  DELIVERY_TIMING_OPTIONS,
} from "./constants";
import type {
  AnnouncementFormValues,
  AnnouncementTargetOptions,
} from "./types";

const CONTENT_MAX_LENGTH = 10_000;

type Props = {
  options: AnnouncementTargetOptions | null;
  submitting: boolean;
  submitError: string | null;
  // 配信先の選択肢(学年・権限・学年制限)の取得エラー
  optionsError: string | null;
  onSaveDraft: (values: AnnouncementFormValues) => void;
  onDeliver: (values: AnnouncementFormValues) => void;
};

export const Presenter = ({
  options,
  submitting,
  submitError,
  optionsError,
  onSaveDraft,
  onDeliver,
}: Props) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    defaultValues: DEFAULT_ANNOUNCEMENT_FORM_VALUES,
  });

  const deliveryTiming = watch("deliveryTiming");
  // 学年制限(own_grade_restriction)は選択肢の取得後に確定するため、取得できるまでは送信させない
  const submitDisabled = submitting || options === null;

  // scheduledAtの必須・未来日時チェックは「配信する」で予約投稿を選んだ場合のみ行う。
  // Controllerのrulesにすると「下書き保存」の送信時にも走ってしまうため、ここで個別に検証する。
  const handleDeliver = handleSubmit((values) => {
    if (values.deliveryTiming === "scheduled") {
      if (!values.scheduledAt) {
        setError("scheduledAt", { message: "投稿日時を指定してください" });
        return;
      }
      if (values.scheduledAt.getTime() <= Date.now()) {
        setError("scheduledAt", { message: "未来の日時を指定してください" });
        return;
      }
    }

    onDeliver(values);
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        お知らせを作成
      </Typography>

      {optionsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {optionsError}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <Stack spacing={3} sx={{ flex: "2 1 480px" }}>
          <Card
            elevation={0}
            sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
          >
            <CardContent>
              <Stack spacing={3}>
                <TextField
                  label="タイトル"
                  fullWidth
                  required
                  {...register("title", {
                    validate: (value) =>
                      value.trim() !== "" || "タイトルを入力してください",
                  })}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
                <TextField
                  label="本文"
                  fullWidth
                  required
                  multiline
                  minRows={10}
                  {...register("content", {
                    validate: (value) =>
                      value.trim() !== "" || "本文を入力してください",
                    maxLength: {
                      value: CONTENT_MAX_LENGTH,
                      message: `本文は${CONTENT_MAX_LENGTH}文字以内で入力してください`,
                    },
                  })}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                />
              </Stack>
            </CardContent>
          </Card>

          <TargetPicker control={control} options={options} />
        </Stack>

        <Box sx={{ flex: "1 1 280px" }}>
          <Card
            elevation={0}
            sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                配信タイミング
              </Typography>
              <Controller
                name="deliveryTiming"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field}>
                    {DELIVERY_TIMING_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                )}
              />

              {deliveryTiming === "scheduled" && (
                <Box sx={{ mt: 2 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={ja}
                  >
                    <Controller
                      name="scheduledAt"
                      control={control}
                      render={({ field, fieldState }) => (
                        <DateTimePicker
                          label="配信日時"
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
      >
        <Button
          component={Link}
          href="/teacher/announcements"
          color="inherit"
          disabled={submitting}
        >
          キャンセル
        </Button>
        <Button
          variant="outlined"
          disabled={submitDisabled}
          onClick={handleSubmit((values) => onSaveDraft(values))}
        >
          下書き保存
        </Button>
        <Button
          variant="contained"
          disabled={submitDisabled || deliveryTiming === "draft"}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          onClick={handleDeliver}
        >
          配信する
        </Button>
      </Box>
    </Box>
  );
};
