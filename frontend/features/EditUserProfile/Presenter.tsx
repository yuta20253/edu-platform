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
import { Controller, useForm, SubmitHandler } from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";

type Props = {
  user: MeUser;
  prefectures: Prefecture[];
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
  street_address: string;
  prefecture_id: number;
};

type Prefecture = {
  id: number;
  name: string;
};

export const Presenter = ({ user, prefectures }: Props) => {
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
      street_address: user.address?.street_address ?? "",
      prefecture_id: user.address?.prefecture?.id ?? undefined,
    },
  });

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    try {
        const formattedData = {
            name: data.name,
            name_kana: data.name_kana,
            gender: data.gender,
            birthday: data.birthday,
            phone_number: data.phone1 + data.phone2 + data.phone3,
            postal_code: data.postal_code,
            city: data.city,
            town: data.town,
            street_address: data.street_address,
            prefecture_id: data.prefecture_id
        };

        console.log(formattedData);
    } catch (error) {
        console.error('ユーザー情報の更新に失敗しました。');
    }
  };

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
