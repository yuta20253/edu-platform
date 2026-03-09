"use client";

import { Box, TextField, Typography, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import { useSubmit } from "./hooks";
import { CreateGoalForm } from "./types";
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";

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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600, pb: 4 }}>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", mt: 8, textAlign: "center" }}
        >
          目標設定
        </Typography>
        <Box sx={{ padding: 2, width: "100%" }}>
          <Box
            component="form"
            sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography>目標名</Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("title", {
                  required: "目標名を入力してください",
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>目標詳細</Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                {...register("description")}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>期限</Typography>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={ja}
              >
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
            <Box sx={{ my: 4 }}>
              <Button
                type="submit"
                sx={{
                  width: "100%",
                  backgroundColor: "#0068b7",
                  color: "#ffffff",
                  p: 2,
                  fontSize: "large",
                }}
              >
                <Typography sx={{ fontSize: "large", textAlign: "center" }}>
                  次へ
                </Typography>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
