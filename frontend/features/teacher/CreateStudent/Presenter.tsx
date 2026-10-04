"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import type { CreateStudentInput, GradeOption } from "./types";

type Props = {
  form: UseFormReturn<CreateStudentInput>;
  gradeOptions: GradeOption[];
  onCreate: (input: CreateStudentInput) => void;
  creating: boolean;
  createErrors: string[];
};

export const Presenter = ({
  form,
  gradeOptions,
  onCreate,
  creating,
  createErrors,
}: Props) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const gradeId = watch("grade_id");
  const schoolClassOptions =
    gradeOptions.find((grade) => grade.id === gradeId)?.school_classes ?? [];

  useEffect(() => {
    setValue("school_class_id", 0);
  }, [gradeId, setValue]);

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        生徒を新規作成
      </Typography>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onCreate)}>
            {createErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                  {createErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </Stack>
              </Alert>
            )}

            <Stack spacing={3}>
              <TextField
                label="氏名"
                fullWidth
                {...register("name", {
                  required: "氏名を入力してください",
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              <TextField
                label="氏名(カナ)"
                fullWidth
                {...register("name_kana", {
                  required: "氏名(カナ)を入力してください",
                })}
                error={!!errors.name_kana}
                helperText={errors.name_kana?.message}
              />
              <TextField
                label="メールアドレス"
                type="email"
                fullWidth
                {...register("email", {
                  required: "メールアドレスを入力してください",
                  pattern: {
                    value: /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                    message: "メールアドレスの形式が正しくありません",
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <Controller
                name="grade_id"
                control={control}
                rules={{
                  validate: (value) => value > 0 || "学年を選択してください",
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="学年"
                    fullWidth
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                    error={!!errors.grade_id}
                    helperText={errors.grade_id?.message}
                  >
                    {gradeOptions.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.display_name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="school_class_id"
                control={control}
                rules={{
                  validate: (value) => value > 0 || "学級を選択してください",
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="学級"
                    fullWidth
                    disabled={schoolClassOptions.length === 0}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value || 0))
                    }
                    error={!!errors.school_class_id}
                    helperText={errors.school_class_id?.message}
                  >
                    {schoolClassOptions.map((schoolClass) => (
                      <MenuItem key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={creating}
                startIcon={
                  creating ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                作成
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
