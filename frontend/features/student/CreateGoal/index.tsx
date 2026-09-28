"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useSubmit } from "./hooks";
import { CreateGoalForm } from "./types";
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";

const fieldLabelSx = { fontSize: 13, fontWeight: 600, mb: 0.75 } as const;

export const CreateGoal = (): React.JSX.Element => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGoalForm>({
    defaultValues: {
      due_date: null,
    },
  });

  const { onSubmit } = useSubmit();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 3 }}>
        目標を追加
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box>
          <Typography sx={fieldLabelSx}>目標名</Typography>
          <TextField
            fullWidth
            placeholder="例：定期テスト対策：数学IA"
            {...register("title", {
              required: "目標名を入力してください",
            })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        </Box>
        <Box>
          <Typography sx={fieldLabelSx}>期限</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Controller
              name="due_date"
              control={control}
              rules={{ required: "期限を選択してください" }}
              render={({ field }) => (
                <DatePicker
                  format="yyyy/MM/dd"
                  value={field.value || null}
                  onChange={(date) => field.onChange(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.due_date,
                      helperText: errors.due_date?.message,
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Box>
        <Box>
          <Typography sx={fieldLabelSx}>説明</Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="目標の詳細を入力"
            {...register("description")}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          <Button component={Link} href="/goals" variant="outlined" fullWidth>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" fullWidth>
            次へ
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
