"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { generateInitialPassword } from "../hooks/generateInitialPassword";
import type { Grade, GradeScope, Teacher } from "../types";

export type TeacherFormValues = {
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  gradeScope: GradeScope;
  manageOtherTeachers: boolean;
  gradeIds: number[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (values: TeacherFormValues) => void;
  submitting: boolean;
  submitErrors: string[];
  grades: Grade[];
  initialTeacher?: Teacher | null;
};

// "姓 名" 形式で保存されているnameを分割してフォームの初期値にする。
const splitName = (name: string) => {
  const [lastName, ...rest] = name.split(" ");
  return { lastName: lastName ?? "", firstName: rest.join(" ") };
};

const buildDefaultValues = (
  mode: Props["mode"],
  teacher?: Teacher | null,
): TeacherFormValues => {
  if (mode === "edit" && teacher) {
    const { lastName, firstName } = splitName(teacher.name);
    return {
      lastName,
      firstName,
      email: teacher.email,
      password: "",
      gradeScope: teacher.grade_scope,
      manageOtherTeachers: teacher.manage_other_teachers,
      gradeIds: teacher.grades.map((grade) => grade.id),
    };
  }

  return {
    lastName: "",
    firstName: "",
    email: "",
    password: "",
    gradeScope: "own_grade",
    manageOtherTeachers: false,
    gradeIds: [],
  };
};

export const TeacherDrawer = ({
  open,
  mode,
  onClose,
  onSubmit,
  submitting,
  submitErrors,
  grades,
  initialTeacher,
}: Props) => {
  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    defaultValues: buildDefaultValues(mode, initialTeacher),
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(mode, initialTeacher));
    }
  }, [open, mode, initialTeacher, reset]);

  const gradeScope = watch("gradeScope");
  const gradeIds = watch("gradeIds");

  const toggleGrade = (gradeId: number, checked: boolean) => {
    const current = gradeIds ?? [];
    setValue(
      "gradeIds",
      checked
        ? [...current, gradeId]
        : current.filter((id) => id !== gradeId),
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100%" } } }}
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${colors.border.light}` }}>
          <Typography variant="h6" fontWeight={700}>
            {mode === "create" ? "教師を追加" : "教師を編集"}
          </Typography>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
          {submitErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                {submitErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </Stack>
            </Alert>
          )}

          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="姓"
                fullWidth
                required
                {...register("lastName", {
                  required: "姓を入力してください",
                })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
              <TextField
                label="名"
                fullWidth
                required
                {...register("firstName", {
                  required: "名を入力してください",
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Stack>

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

            {mode === "create" && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  label="初期パスワード"
                  fullWidth
                  required
                  {...register("password", {
                    required: "初期パスワードを入力してください",
                    minLength: {
                      value: 6,
                      message: "6文字以上で入力してください",
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
                <Button
                  variant="outlined"
                  sx={{ whiteSpace: "nowrap", mt: 1 }}
                  onClick={() =>
                    setValue("password", generateInitialPassword(), {
                      shouldValidate: true,
                    })
                  }
                >
                  自動生成
                </Button>
              </Stack>
            )}

            <Controller
              name="gradeScope"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    担当学年権限
                  </Typography>
                  <RadioGroup row {...field}>
                    <FormControlLabel
                      value="own_grade"
                      control={<Radio />}
                      label="自学年"
                    />
                    <FormControlLabel
                      value="all_grades"
                      control={<Radio />}
                      label="全学年"
                    />
                  </RadioGroup>
                </Box>
              )}
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                担当学年
              </Typography>
              <FormGroup row>
                {grades.map((grade) => (
                  <FormControlLabel
                    key={grade.id}
                    control={
                      <Checkbox
                        checked={(gradeIds ?? []).includes(grade.id)}
                        disabled={gradeScope === "all_grades"}
                        onChange={(event) =>
                          toggleGrade(grade.id, event.target.checked)
                        }
                      />
                    }
                    label={grade.name}
                  />
                ))}
              </FormGroup>
            </Box>

            <Controller
              name="manageOtherTeachers"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.checked)
                      }
                    />
                  }
                  label="他教師管理"
                />
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
          <Button onClick={onClose} disabled={submitting} color="inherit">
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {mode === "create" ? "追加" : "保存"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
