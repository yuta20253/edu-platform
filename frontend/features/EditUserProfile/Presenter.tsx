"use client";

import { MeUser } from "@/types/common/me";
import {
  Autocomplete,
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
import {
  Control,
  Controller,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";
import { Snackbar, Alert } from "@mui/material";
import { Prefecture } from "@/types/common/prefecture";
import { ProfileForm } from "./types";

type Props = {
  user: MeUser;
  prefectures: Prefecture[];
  control: Control<ProfileForm>;
  register: UseFormRegister<ProfileForm>;
  errors: FieldErrors<ProfileForm>;
  handleSubmit: UseFormHandleSubmit<ProfileForm>;
  onSubmit: (data: ProfileForm) => void;
  setValue: UseFormSetValue<ProfileForm>;
  prefectureId: number | null;
  city: string;
  cityOptions: string[];
  townOptions: {
    id: number;
    city: string;
    town: string;
  }[];
  setCityOptions: (v: string[]) => void;
  setTownOptions: (
    v: {
      id: number;
      city: string;
      town: string;
    }[],
  ) => void;
  toast: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  closeToast: () => void;
};

export const Presenter = ({
  user,
  prefectures,
  control,
  register,
  errors,
  handleSubmit,
  onSubmit,
  setValue,
  prefectureId,
  city,
  cityOptions,
  townOptions,
  setCityOptions,
  setTownOptions,
  toast,
  closeToast,
}: Props) => {
  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 4,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            width: "100%",
          }}
        >
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              p: 4,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mb: 4,
              }}
            >
              ユーザー情報
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register("address_id")} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名
              </Typography>
              <TextField
                fullWidth
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名カナ
              </Typography>
              <TextField
                fullWidth
                {...register("name_kana")}
                error={!!errors.name_kana}
                helperText={errors.name_kana?.message}
              />

              <Divider sx={{ my: 2 }} />

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
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>

              <Divider sx={{ my: 2 }} />

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

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                電話番号
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                }}
              >
                <TextField {...register("phone_number")} />
              </Box>
              <Typography sx={{ color: "red" }}>
                ※ ハイフンなしで入力してください
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                郵便番号
              </Typography>

              <TextField fullWidth {...register("postal_code")} />

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                都道府県
              </Typography>
              <Controller
                name="prefecture_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      field.onChange(value);

                      setValue("city", "");
                      setValue("town", "");
                      setValue("address_id", null);

                      setCityOptions([]);
                      setTownOptions([]);
                    }}
                  >
                    <MenuItem value="">選択してください</MenuItem>

                    {prefectures.map((prefecture) => (
                      <MenuItem key={prefecture.id} value={prefecture.id}>
                        {prefecture.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                市区町村
              </Typography>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={!prefectureId}
                    options={cityOptions}
                    value={field.value || null}
                    isOptionEqualToValue={(option, value) => option === value}
                    getOptionLabel={(option) => option}
                    onChange={(_, value) => {
                      field.onChange(value || "");

                      setValue("town", "");
                      setValue("address_id", null);

                      setTownOptions([]);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth placeholder="市区町村" />
                    )}
                  />
                )}
              />

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                町名・丁目
              </Typography>
              <Controller
                name="town"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={!city}
                    options={townOptions}
                    value={
                      townOptions.find(
                        (option) => option.town === field.value,
                      ) || null
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.town}
                    onChange={(_, value) => {
                      field.onChange(value?.town || "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        placeholder="町名・丁目"
                      />
                    )}
                  />
                )}
              />

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                番地・号等
              </Typography>
              <TextField fullWidth {...register("street_address")} />

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  在籍高校
                </Typography>
                <Typography>{user.high_school?.name ?? "未設定"}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  学年
                </Typography>
                <Typography>{user.grade?.display_name ?? "未設定"}</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button variant="outlined" href="/profile">
                  戻る
                </Button>

                <Button type="submit" variant="contained">
                  更新
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};
