"use client";

import { colors } from "@/app/theme/colors";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { PERMISSION_NOT_FOUND_MESSAGE } from "../constants";
import type {
  PermissionTeacherDetail,
  UpdatePermissionInput,
  UpdatePermissionPayload,
} from "../types";

type Props = {
  teacherId: number;
  onSubmit: (payload: UpdatePermissionPayload) => void;
  onCancel: () => void;
  updating: boolean;
};

// 編集ドロワーの中身。開くたびに(呼び出し側が key で作り直すたびに)最新の権限を取り直す
export const PermissionEditForm = ({
  teacherId,
  onSubmit,
  onCancel,
  updating,
}: Props) => {
  const { data, error, errorStatus, refetch } =
    useApiQuery<PermissionTeacherDetail>(
      `/api/teacher/permissions/${teacherId}`,
    );

  // 対象の教員が見つからないときは、再試行しても直らないので案内だけを出す
  if (errorStatus === 404) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{PERMISSION_NOT_FOUND_MESSAGE}</Alert>
      </Box>
    );
  }

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(detail) => (
        <PermissionFields
          detail={detail}
          onSubmit={onSubmit}
          onCancel={onCancel}
          updating={updating}
        />
      )}
    </AsyncBoundary>
  );
};

type FieldsProps = Omit<Props, "teacherId"> & {
  detail: PermissionTeacherDetail;
};

// 取得した値が揃ってからマウントするので、defaultValues だけで初期化できる
const PermissionFields = ({
  detail,
  onSubmit,
  onCancel,
  updating,
}: FieldsProps) => {
  const { grade_scope, manage_other_teachers, lock_version } =
    detail.teacher_permission;
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdatePermissionInput>({
    defaultValues: { grade_scope, manage_other_teachers },
  });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((values) => onSubmit({ ...values, lock_version }))}
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <Box sx={{ p: 3, flex: 1, overflow: "auto" }}>
        <Stack spacing={3}>
          <Controller
            name="grade_scope"
            control={control}
            rules={{ required: "操作範囲を選択してください" }}
            render={({ field }) => (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  操作範囲
                </Typography>
                <RadioGroup row {...field} value={field.value}>
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

                <RadioGroup
                  row
                  value={field.value ? "1" : "0"}
                  onChange={(event) =>
                    field.onChange(event.target.value === "1")
                  }
                >
                  <FormControlLabel value="0" control={<Radio />} label="無" />
                  <FormControlLabel value="1" control={<Radio />} label="有" />
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
        <Button onClick={onCancel} disabled={updating} color="inherit">
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={updating}
          startIcon={
            updating ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          保存
        </Button>
      </Box>
    </Box>
  );
};
