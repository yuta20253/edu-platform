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
import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateInterviewForm, StudentOption } from "./types";

// バックエンドの InterviewRequest#reason_detail の上限と合わせる
const REASON_DETAIL_MAX_LENGTH = 2000;

type Props = {
  // サーバーで生徒名を検索した結果。クライアント側では絞り込まない
  studentOptions: StudentOption[];
  searching: boolean;
  searchError: boolean;
  onKeywordChange: (keyword: string) => void;
  // 生徒詳細から遷移したときに選択しておく生徒
  initialStudent?: StudentOption | null;
  onSubmit: SubmitHandler<CreateInterviewForm>;
  submitError?: string;
};

export const Presenter = ({
  studentOptions,
  searching,
  searchError,
  onKeywordChange,
  initialStudent = null,
  onSubmit,
  submitError,
}: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInterviewForm>({
    defaultValues: { student_id: initialStudent?.id },
  });
  const [selectedStudent, setSelectedStudent] = useState(initialStudent);

  // 選択中の生徒が検索結果に無くても表示できるよう、候補の先頭に含める
  const options =
    selectedStudent && !studentOptions.some((s) => s.id === selectedStudent.id)
      ? [selectedStudent, ...studentOptions]
      : studentOptions;

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
                    options={options}
                    getOptionLabel={(student) => student.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    filterOptions={(x) => x}
                    value={selectedStudent}
                    onChange={(_, student) => {
                      setSelectedStudent(student);
                      field.onChange(student?.id);
                    }}
                    onInputChange={(_, value, reason) => {
                      // 候補を選んだときの表示の書き換えでは検索し直さない
                      if (reason === "input" || reason === "clear") {
                        onKeywordChange(value);
                      }
                    }}
                    onBlur={field.onBlur}
                    loading={searching}
                    loadingText="検索中…"
                    noOptionsText={
                      searchError
                        ? "生徒の取得に失敗しました"
                        : "該当する生徒がいません"
                    }
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
