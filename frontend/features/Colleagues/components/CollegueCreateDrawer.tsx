"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { CreateTeacherInput } from "../types";
import { apiClient } from "@/libs/http/apiClient";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateTeacherInput) => void;
  creating: boolean;
  createErrors: string[];
};

export const CollegueCreateDrawer = ({
  open,
  onClose,
  onCreate,
  creating,
  createErrors,
}: Props) => {
  const [gradeOptions, setGradeOptions] = useState<
    Array<{ id: number; year: number; display_name: string }>
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTeacherInput>({
    defaultValues: {
      name: "",
      name_kana: "",
      email: "",
      grade_id: 0,
      grade_scope: 0,
      manage_other_teachers: false,
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        name_kana: "",
        email: "",
        grade_id: 0,
        grade_scope: 0,
        manage_other_teachers: false,
      });
      setGradeOptions([]);
      return;
    }

    const fetchGrades = async () => {
      try {
        const res = await apiClient.get<
          Array<{ id: number; year: number; display_name: string }>
        >("/api/v1/teacher/grades");
        setGradeOptions(res.data);
        console.log(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    void fetchGrades();
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
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            教員を追加
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.text.muted, mt: 0.5 }}
          >
            招待メールが送信され、本人がパスワードを設定します。
          </Typography>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflow: "auto" }}>
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
              required
              {...register("name", {
                required: "氏名を入力してください",
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="氏名(カナ)"
              fullWidth
              required
              {...register("name_kana", {
                required: "氏名を入力してください",
              })}
              error={!!errors.name_kana}
              helperText={errors.name_kana?.message}
            />
            <TextField
              label="メールアドレス"
              type="email"
              fullWidth
              required
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
              rules={{ required: "学年を選択してください" }}
              render={({ field }) => {
                const safeValue = Number.isFinite(field.value)
                  ? field.value
                  : 0;

                return (
                  <TextField
                    {...field}
                    select
                    label="担当学年"
                    fullWidth
                    value={safeValue}
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
                );
              }}
            />

            <Controller
              name="grade_scope"
              control={control}
              rules={{ required: "操作範囲を選択してください" }}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    操作範囲
                  </Typography>
                  <RadioGroup
                    row
                    {...field}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  >
                    <FormControlLabel
                      value={0}
                      control={<Radio />}
                      label="自学年"
                    />
                    <FormControlLabel
                      value={1}
                      control={<Radio />}
                      label="全学年"
                    />
                  </RadioGroup>
                  {errors.grade_scope && (
                    <FormHelperText error>
                      {errors.grade_scope.message}
                    </FormHelperText>
                  )}
                </Box>
              )}
            />

            <Controller
              name="manage_other_teachers"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    他の教員操作権限
                  </Typography>
                  <RadioGroup row {...field} value={field.value ? 1 : 0}>
                    <FormControlLabel
                      value={0}
                      control={<Radio />}
                      label="無"
                    />
                    <FormControlLabel
                      value={1}
                      control={<Radio />}
                      label="有"
                    />
                  </RadioGroup>
                </Box>
              )}
            />
          </Stack>
        </Box>

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
