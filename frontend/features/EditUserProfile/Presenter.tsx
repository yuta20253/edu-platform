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
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";

type Props = {
  user: MeUser;
};

type ProfileForm = {
  name: string;
  name_kana: string;
  phone1: string;
  phone2: string;
  phone3: string;
  birthday: string;
  gender: string;
  postal_code: string;
  city: string;
  town: string;
};

export const Presenter = ({ user }: Props) => {
  const phone = user.user_personal_info?.phone_number ?? "";

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user.name,
      name_kana: user.name_kana,
      phone1: phone.slice(0, 3),
      phone2: phone.slice(3, 7),
      phone3: phone.slice(7),
      birthday: user.user_personal_info?.birthday ?? "",
      gender: user.user_personal_info?.gender ?? "",
      postal_code: user.address?.postal_code ?? "",
      city: user.address?.city ?? "",
      town: user.address?.town ?? "",
    },
  });

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
            onSubmit={handleSubmit((data) => console.log(data))}
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
                        field.onChange(date?.toISOString() ?? "")
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
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {/* {user.address ? addressLabel(user.address) : "未設定"} */}
              </Typography>
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
