"use client";

import { colors } from "@/app/theme/colors";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { useStudentSearch } from "../hooks/useStudentSearch";
import type { AnnouncementFormValues, StudentOption } from "../types";

type Props = {
  control: Control<AnnouncementFormValues>;
  index: number;
};

const studentLabel = (student: StudentOption) =>
  `${student.name}(${student.grade.display_name})`;

export const StudentPicker = ({ control, index }: Props) => {
  const { query, handleQueryChange, page, setPage, students } =
    useStudentSearch();
  // 検索やページ送りで選択済みの生徒が一覧から外れてもSelectの表示が空にならないよう保持する
  const [selected, setSelected] = useState<StudentOption | null>(null);

  const items = students?.items ?? [];
  const totalPages = students?.meta.total_pages ?? 1;
  const menuStudents =
    selected && !items.some((s) => s.id === selected.id)
      ? [selected, ...items]
      : items;

  return (
    <Stack spacing={1}>
      <TextField
        label="生徒を検索"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
      />
      <Controller
        name={`targets.${index}.user_id`}
        control={control}
        rules={{ required: "生徒を選択してください" }}
        render={({ field, fieldState }) => (
          <TextField
            select
            label="生徒"
            value={field.value ?? ""}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelected(menuStudents.find((s) => s.id === id) ?? null);
              field.onChange(id);
            }}
            sx={{ minWidth: 220 }}
          >
            {menuStudents.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {studentLabel(student)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {totalPages > 1 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            前へ
          </Button>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {page} / {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            次へ
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
