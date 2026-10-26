"use client";

import { colors } from "@/app/theme/colors";
import {
  schoolClassRequestActionLabel,
  schoolClassRequestActions,
} from "@/constants/school_class_request";
import type { SchoolClassRequestAction } from "@/types/schoolClassRequest/schoolClassRequest";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { CreateSchoolClassRequestForm, GradeOption } from "./types";

// バックエンドの CreateSchoolClassRequestForm#name の上限と合わせる
const NAME_MAX_LENGTH = 255;

type FormValues = {
  action: SchoolClassRequestAction;
  // 未選択は ""(MUI の select の空値)
  grade_id: number | "";
  school_class_id: number | "";
  name: string;
};

type Props = {
  grades: GradeOption[];
  onSubmit: (data: CreateSchoolClassRequestForm) => void | Promise<void>;
  submitError?: string;
};

const toNumberOrEmpty = (value: string | number) =>
  value === "" ? "" : Number(value);

export const Presenter = ({ grades, onSubmit, submitError }: Props) => {
  const {
    control,
    register,
    handleSubmit,
    resetField,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      action: "creation",
      grade_id: "",
      school_class_id: "",
      name: "",
    },
    // 種別を切り替えて隠れた項目は、値もバリデーションも外す
    shouldUnregister: true,
  });

  const action = watch("action");
  const gradeId = watch("grade_id");
  const needsSchoolClass = action !== "creation";
  const needsName = action !== "deletion";
  const schoolClassOptions =
    grades.find((grade) => grade.id === gradeId)?.school_classes ?? [];

  const submit = (values: FormValues) =>
    onSubmit({
      action: values.action,
      grade_id: Number(values.grade_id),
      school_class_id:
        values.school_class_id === ""
          ? undefined
          : Number(values.school_class_id),
      name: values.name,
    });

  return (
    <Box sx={{ p: 3, maxWidth: 560, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        学級を申請
      </Typography>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel id="school-class-request-action">
                  申請の種別
                </FormLabel>
                <Controller
                  name="action"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      row
                      aria-labelledby="school-class-request-action"
                    >
                      {schoolClassRequestActions.map((value) => (
                        <FormControlLabel
                          key={value}
                          value={value}
                          control={<Radio />}
                          label={schoolClassRequestActionLabel[value]}
                        />
                      ))}
                    </RadioGroup>
                  )}
                />
              </FormControl>

              {action === "deletion" && (
                <Alert severity="info">
                  生徒または教員が所属しているクラスは削除できません。
                </Alert>
              )}

              <Controller
                name="grade_id"
                control={control}
                rules={{ required: "学年を選択してください" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="学年"
                    fullWidth
                    onChange={(event) => {
                      field.onChange(toNumberOrEmpty(event.target.value));
                      // 前の学年のクラスを選んだまま申請しないよう、選択を外す
                      resetField("school_class_id");
                    }}
                    error={!!errors.grade_id}
                    helperText={errors.grade_id?.message}
                  >
                    {grades.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.display_name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {needsSchoolClass && (
                <Controller
                  name="school_class_id"
                  control={control}
                  rules={{ required: "対象クラスを選択してください" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="対象クラス"
                      fullWidth
                      disabled={schoolClassOptions.length === 0}
                      onChange={(event) =>
                        field.onChange(toNumberOrEmpty(event.target.value))
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
              )}

              {needsName && (
                <TextField
                  id="school-class-request-name"
                  label={action === "modification" ? "新しいクラス名" : "クラス名"}
                  fullWidth
                  {...register("name", {
                    required: "クラス名を入力してください",
                    maxLength: {
                      value: NAME_MAX_LENGTH,
                      message: `クラス名は${NAME_MAX_LENGTH}文字以内で入力してください`,
                    },
                  })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/teacher/school-class-requests"
                  variant="outlined"
                  fullWidth
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                >
                  申請する
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
