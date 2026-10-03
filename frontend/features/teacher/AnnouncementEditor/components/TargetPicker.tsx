"use client";

import { colors } from "@/app/theme/colors";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import {
  Controller,
  useController,
  useFieldArray,
  type Control,
} from "react-hook-form";
import type {
  AnnouncementFormValues,
  AnnouncementTargetOptions,
  TargetType,
} from "../types";

type Props = {
  control: Control<AnnouncementFormValues>;
  options: AnnouncementTargetOptions | null;
  studentKeyword: string;
  onStudentKeywordChange: (keyword: string) => void;
};

const ALL_TARGET_TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "all_users", label: "全員" },
  { value: "by_role", label: "権限別" },
  { value: "by_grade", label: "学年別" },
  { value: "by_school", label: "学校全体" },
  { value: "by_user", label: "個人" },
];

// 学年別・個人以外は学年による絞り込みを行わないため、own_grade_restriction
// がある教員がこれらを選ぶと自分の学年外にも配信できてしまう。
// Rails側のgrade_scope_validationはby_gradeタイプのみ検証するため、
// UI側でも選択肢自体を絞ってこれを防ぐ。
const GRADE_RESTRICTED_TARGET_TYPE_OPTIONS: {
  value: TargetType;
  label: string;
}[] = ALL_TARGET_TYPE_OPTIONS.filter(
  (opt) => opt.value === "by_grade" || opt.value === "by_user",
);

type RowProps = {
  control: Control<AnnouncementFormValues>;
  index: number;
  options: AnnouncementTargetOptions | null;
  studentKeyword: string;
  onStudentKeywordChange: (keyword: string) => void;
  onRemove: () => void;
};

const TargetRow = ({
  control,
  index,
  options,
  studentKeyword,
  onStudentKeywordChange,
  onRemove,
}: RowProps) => {
  const { field: targetTypeField } = useController({
    control,
    name: `targets.${index}.target_type`,
  });
  const targetType = targetTypeField.value;

  const targetTypeOptions =
    options?.own_grade_restriction != null
      ? GRADE_RESTRICTED_TARGET_TYPE_OPTIONS
      : ALL_TARGET_TYPE_OPTIONS;

  // own_grade_restrictionの有無はAPIレスポンス取得後に確定するため、
  // マウント時のデフォルト値(全員)が後から選択不可になるケースがある。
  // その場合は選択可能な種類の先頭へ自動的に補正する。
  useEffect(() => {
    if (targetTypeOptions.some((opt) => opt.value === targetType)) return;
    targetTypeField.onChange(targetTypeOptions[0].value);
  }, [targetType, targetTypeOptions, targetTypeField]);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      flexWrap="wrap"
    >
      <TextField
        {...targetTypeField}
        select
        label="配信先の種類"
        sx={{ minWidth: 160 }}
      >
        {targetTypeOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      {targetType === "by_grade" && (
        <Controller
          name={`targets.${index}.grade_id`}
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="学年"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(Number(e.target.value))}
              sx={{ minWidth: 160 }}
            >
              {(options?.grades ?? []).map((grade) => (
                <MenuItem key={grade.id} value={grade.id}>
                  {grade.display_name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      )}

      {targetType === "by_role" && (
        <Controller
          name={`targets.${index}.user_role_id`}
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="権限"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(Number(e.target.value))}
              sx={{ minWidth: 160 }}
            >
              {(options?.user_roles ?? []).map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      )}

      {targetType === "by_user" && (
        <Stack spacing={1}>
          <TextField
            label="生徒を検索"
            value={studentKeyword}
            onChange={(e) => onStudentKeywordChange(e.target.value)}
          />
          <Controller
            name={`targets.${index}.user_id`}
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="生徒"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
                sx={{ minWidth: 220 }}
              >
                {(options?.students.items ?? []).map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}({student.grade.display_name})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      )}

      <IconButton aria-label="削除" onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
};

export const TargetPicker = ({
  control,
  options,
  studentKeyword,
  onStudentKeywordChange,
}: Props) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "targets",
  });

  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          配信先
        </Typography>
        <Stack spacing={2}>
          {fields.map((field, index) => (
            <TargetRow
              key={field.id}
              control={control}
              index={index}
              options={options}
              studentKeyword={studentKeyword}
              onStudentKeywordChange={onStudentKeywordChange}
              onRemove={() => remove(index)}
            />
          ))}
        </Stack>
        <Button
          sx={{ mt: 2 }}
          onClick={() => append({ target_type: "all_users" })}
        >
          配信先を追加
        </Button>
      </CardContent>
    </Card>
  );
};
