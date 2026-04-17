"use client";

import { MeUser } from "@/types/common/me";
import {
  Box,
  Typography,
  Divider,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";
import { useSubmit } from "./hooks/useSubmit";
import { useDefaultValues } from "./hooks/useDefaultValues";

type Props = {
  user: MeUser;
  prefectures: Prefecture[];
};

type Prefecture = {
  id: number;
  name: string;
};

export const Presenter = ({ user, prefectures }: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useDefaultValues(user);

  const { onSubmit } = useSubmit();

  return (
    <Box sx={{ px: 2, py: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 800, width: "100%" }}>
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
            ユーザー情報
          </Typography>
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("name", {
                  required: "氏名は必須です",
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名カナ
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("name_kana", {
                  required: "氏名は必須です",
                })}
                error={!!errors.name_kana}
                helperText={errors.name_kana?.message}
              />
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                生年月日
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={ja}
              >
                <Controller
                  name="birthday"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="yyyy-MM-dd"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.birthday,
                          helperText: errors.birthday?.message,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                性別
              </Typography>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel
                      value="male"
                      control={<Radio />}
                      label="男"
                    />
                    <FormControlLabel
                      value="female"
                      control={<Radio />}
                      label="女"
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio />}
                      label="その他"
                    />
                  </RadioGroup>
                )}
              />
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                電話番号
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  {...register("phone1")}
                  slotProps={{ htmlInput: { maxLength: 3 } }}
                />
                <Typography
                  sx={{ justifyContent: "center", alignContent: "center" }}
                >
                  -
                </Typography>
                <TextField
                  {...register("phone2")}
                  slotProps={{ htmlInput: { maxLength: 4 } }}
                />
                <Typography
                  sx={{ justifyContent: "center", alignContent: "center" }}
                >
                  -
                </Typography>
                <TextField
                  {...register("phone3")}
                  slotProps={{ htmlInput: { maxLength: 4 } }}
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                住所
              </Typography>

              <TextField
                fullWidth
                placeholder="郵便番号"
                {...register("postal_code")}
                sx={{ mb: 2 }}
              />

              <Controller
                name="prefecture_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {prefectures?.map((prefecture) => (
                      <MenuItem key={prefecture.id} value={prefecture.id}>
                        {prefecture.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                fullWidth
                placeholder="市区町村"
                {...register("city")}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                placeholder="町名・丁目"
                {...register("town")}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                placeholder="番地・建物名等"
                {...register("street_address")}
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                在籍高校
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.high_school?.name ?? "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                学年
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.grade?.display_name ?? "未設定"}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
              }}
            >
              <Button variant="outlined">戻る</Button>
              <Button type="submit" variant="contained">
                更新
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
