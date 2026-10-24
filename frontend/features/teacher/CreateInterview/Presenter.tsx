"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateInterviewForm, StudentOption } from "./types";

// バックエンドの InterviewRequest#reason_detail の上限と合わせる
const REASON_DETAIL_MAX_LENGTH = 2000;

type Props = {
  students: StudentOption[];
  // 生徒詳細から遷移したときに選択しておく生徒。候補に無ければ未選択にする
  initialStudentId?: number;
  onSubmit: SubmitHandler<CreateInterviewForm>;
  submitError?: string;
};

export const Presenter = ({
  students,
  initialStudentId,
  onSubmit,
  submitError,
}: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInterviewForm>({
    defaultValues: {
      student_id: students.some((s) => s.id === initialStudentId)
        ? initialStudentId
        : undefined,
    },
  });

  const noStudents = students.length === 0;

  return (
    <Box sx={{ p: 3, maxWidth: 560, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        面談を申請
      </Typography>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent>
          {noStudents && (
            <Alert severity="info" sx={{ mb: 2 }}>
              申請できる生徒がいません。担当する生徒が登録されているか確認してください
            </Alert>
          )}
          {submitError && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="student_id"
                control={control}
                rules={{ required: "生徒を選択してください" }}
                render={({ field }) => (
                  <Autocomplete
                    options={students}
                    getOptionLabel={(student) => student.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    value={students.find((s) => s.id === field.value) ?? null}
                    onChange={(_, student) => field.onChange(student?.id)}
                    onBlur={field.onBlur}
                    disabled={noStudents}
                    noOptionsText="該当する生徒がいません"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="生徒"
                        placeholder="名前で検索"
                        error={!!errors.student_id}
                        helperText={errors.student_id?.message}
                      />
                    )}
                  />
                )}
              />

              <TextField
                id="interview-reason-detail"
                label="相談内容"
                multiline
                rows={5}
                fullWidth
                placeholder="面談で話したい内容を書いてください"
                {...register("reason_detail", {
                  required: "相談内容を入力してください",
                  maxLength: {
                    value: REASON_DETAIL_MAX_LENGTH,
                    message: `相談内容は${REASON_DETAIL_MAX_LENGTH}文字以内で入力してください`,
                  },
                })}
                error={!!errors.reason_detail}
                helperText={errors.reason_detail?.message}
              />

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/teacher/interviews"
                  variant="outlined"
                  fullWidth
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={noStudents || isSubmitting}
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
