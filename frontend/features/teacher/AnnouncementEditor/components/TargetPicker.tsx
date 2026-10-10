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
import { useCallback, useEffect } from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFieldArrayUpdate,
} from "react-hook-form";
import {
  ALL_TARGET_TYPE_OPTIONS,
  GRADE_RESTRICTED_TARGET_TYPE_OPTIONS,
  USER_ROLE_LABEL,
} from "../constants";
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
  studentPage: number;
  onStudentPageChange: (page: number) => void;
};

type RowProps = {
  control: Control<AnnouncementFormValues>;
  index: number;
  options: AnnouncementTargetOptions | null;
  studentKeyword: string;
  onStudentKeywordChange: (keyword: string) => void;
  studentPage: number;
  onStudentPageChange: (page: number) => void;
  onUpdate: UseFieldArrayUpdate<AnnouncementFormValues, "targets">;
  onRemove: () => void;
};

const TargetRow = ({
  control,
  index,
  options,
  studentKeyword,
  onStudentKeywordChange,
  studentPage,
  onStudentPageChange,
  onUpdate,
  onRemove,
}: RowProps) => {
  const targetType = useWatch({
    control,
    name: `targets.${index}.target_type`,
  });

  // 種類を変えたら前の種類で選んだ値(grade_id/user_idなど)が送られないよう行ごと置き換える
  const changeTargetType = useCallback(
    (value: TargetType) => onUpdate(index, { target_type: value }),
    [onUpdate, index],
  );

  const targetTypeOptions =
    options?.own_grade_restriction != null
      ? GRADE_RESTRICTED_TARGET_TYPE_OPTIONS
      : ALL_TARGET_TYPE_OPTIONS;

  // own_grade_restrictionの有無はAPIレスポンス取得後に確定するため、
  // マウント時のデフォルト値(全員)が後から選択不可になるケースがある。
  // その場合は選択可能な種類の先頭へ自動的に補正する。
  useEffect(() => {
    if (targetTypeOptions.some((opt) => opt.value === targetType)) return;
    changeTargetType(targetTypeOptions[0].value);
  }, [targetType, targetTypeOptions, changeTargetType]);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      flexWrap="wrap"
    >
      <TextField
        value={targetType}
        onChange={(e) => changeTargetType(e.target.value as TargetType)}
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

      {/* by_gradeも「学年×権限」(例: 1年の生徒)で配信するため権限の指定が必要 */}
      {(targetType === "by_role" || targetType === "by_grade") && (
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
                  {USER_ROLE_LABEL[role.name] ?? role.name}
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
          {(options?.students.meta.total_pages ?? 1) > 1 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                disabled={studentPage <= 1}
                onClick={() => onStudentPageChange(studentPage - 1)}
              >
                前へ
              </Button>
              <Typography variant="body2" sx={{ color: colors.text.muted }}>
                {studentPage} / {options?.students.meta.total_pages}
              </Typography>
              <Button
                size="small"
                disabled={
                  studentPage >= (options?.students.meta.total_pages ?? 1)
                }
                onClick={() => onStudentPageChange(studentPage + 1)}
              >
                次へ
              </Button>
            </Stack>
          )}
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
  studentPage,
  onStudentPageChange,
}: Props) => {
  const { fields, append, remove, update } = useFieldArray({
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
              studentPage={studentPage}
              onStudentPageChange={onStudentPageChange}
              onUpdate={update}
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
