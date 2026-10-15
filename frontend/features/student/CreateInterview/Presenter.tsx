"use client";

import { FormLabel } from "@/components/student/Form";
import {
  interviewReasonCategories,
  interviewReasonCategoryLabel,
} from "@/constants/interview_request";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateInterviewForm, Teacher } from "./types";

// Rails の InterviewRequest#reason_detail の上限と合わせる
const REASON_DETAIL_MAX_LENGTH = 2000;

type Props = {
  teachers: Teacher[];
  onSubmit: SubmitHandler<CreateInterviewForm>;
  submitError?: string;
};

export const Presenter = ({ teachers, onSubmit, submitError }: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInterviewForm>();

  const noTeachers = teachers.length === 0;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 3 }}>
        面談を申請
      </Typography>

      {noTeachers && (
        <Alert severity="info" sx={{ mb: 2 }}>
          申請できる先生がいません。所属する学級が登録されているか確認してください
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {submitError}
        </Alert>
      )}

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box>
          <FormLabel id="interview-teacher-label">先生</FormLabel>
          <Controller
            name="teacher_id"
            control={control}
            rules={{ required: "先生を選択してください" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.teacher_id}>
                <Select
                  labelId="interview-teacher-label"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onBlur={field.onBlur}
                  disabled={noTeachers}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.teacher_id && (
                  <FormHelperText>{errors.teacher_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Box>

        <Box>
          <FormLabel id="interview-category-label">相談カテゴリ</FormLabel>
          <Controller
            name="reason_category"
            control={control}
            rules={{ required: "相談カテゴリを選択してください" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.reason_category}>
                <Select
                  labelId="interview-category-label"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                >
                  {interviewReasonCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {interviewReasonCategoryLabel[category]}
                    </MenuItem>
                  ))}
                </Select>
                {errors.reason_category && (
                  <FormHelperText>
                    {errors.reason_category.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Box>

        <Box>
          <FormLabel htmlFor="interview-reason-detail">相談内容</FormLabel>
          <TextField
            id="interview-reason-detail"
            multiline
            rows={5}
            fullWidth
            placeholder="相談したい内容を具体的に書いてください"
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
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          <Button
            component={Link}
            href="/interviews"
            variant="outlined"
            fullWidth
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={noTeachers || isSubmitting}
          >
            申請する
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
