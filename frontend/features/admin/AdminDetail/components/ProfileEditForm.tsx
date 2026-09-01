"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import type { Prefecture } from "@/types/common/prefecture";
import { useFetchAddresses } from "../hooks/useFetchAddresses";
import type { AdminDetail, AdminEditForm, UpdateAdminInput } from "../types";

// 未設定時に DatePicker のカレンダーが開く基準日（1999年ごろ）。
const BIRTHDAY_REFERENCE_DATE = new Date(1999, 0, 1);

type Props = {
  admin: AdminDetail;
  prefectures: Prefecture[];
  onUpdate: (input: UpdateAdminInput) => Promise<boolean>;
  onCancel: () => void;
  updating: boolean;
  updateErrors: string[];
};

const buildDefaultValues = (admin: AdminDetail): AdminEditForm => ({
  name: admin.name,
  name_kana: admin.name_kana ?? "",
  email: admin.email,
  phone_number: admin.user_personal_info?.phone_number ?? "",
  birthday: admin.user_personal_info?.birthday ?? "",
  gender: admin.user_personal_info?.gender ?? "",
  prefecture_id: admin.address?.prefecture?.id ?? null,
  city: admin.address?.city ?? "",
  town: admin.address?.town ?? "",
  address_id: admin.address?.id ?? null,
});

export const ProfileEditForm = ({
  admin,
  prefectures,
  onUpdate,
  onCancel,
  updating,
  updateErrors,
}: Props) => {
  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminEditForm>({
    defaultValues: buildDefaultValues(admin),
  });

  const prefectureId = watch("prefecture_id");
  const city = watch("city");
  const town = watch("town");

  const {
    cityOptions,
    townOptions,
    fetchCities,
    fetchTowns,
    setCityOptions,
    setTownOptions,
  } = useFetchAddresses();

  // 初期表示時に既存住所の候補を表示しておく（API 取得前のフォールバック）。
  const initialCityOptions = useMemo(
    () => (admin.address ? [admin.address.city] : []),
    [admin.address],
  );
  const initialTownOptions = useMemo(
    () =>
      admin.address
        ? [
            {
              id: admin.address.id,
              city: admin.address.city,
              town: admin.address.town,
            },
          ]
        : [],
    [admin.address],
  );

  useEffect(() => {
    if (!prefectureId) {
      setCityOptions([]);
      setTownOptions([]);
      return;
    }
    fetchCities(prefectureId);
  }, [prefectureId, fetchCities, setCityOptions, setTownOptions]);

  useEffect(() => {
    if (!prefectureId || !city) {
      setTownOptions([]);
      return;
    }
    fetchTowns(prefectureId, city);
  }, [prefectureId, city, fetchTowns, setTownOptions]);

  const mergedCityOptions =
    cityOptions.length > 0 ? cityOptions : initialCityOptions;
  const mergedTownOptions =
    townOptions.length > 0 ? townOptions : initialTownOptions;

  // town に対応する address_id を同期する。
  useEffect(() => {
    if (!town) {
      setValue("address_id", null);
      return;
    }
    const selected = mergedTownOptions.find((item) => item.town === town);
    setValue("address_id", selected ? selected.id : null);
  }, [town, mergedTownOptions, setValue]);

  const handleSave = (data: AdminEditForm) => {
    return onUpdate({
      name: data.name,
      name_kana: data.name_kana,
      email: data.email,
      phone_number: data.phone_number,
      birthday: data.birthday,
      gender: data.gender,
      address_id: data.address_id,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleSave)}>
      <input type="hidden" {...register("address_id")} />

      {updateErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
            {updateErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </Stack>
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="名前"
          fullWidth
          required
          {...register("name", { required: "名前を入力してください" })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="氏名カナ"
          fullWidth
          {...register("name_kana")}
          error={!!errors.name_kana}
          helperText={errors.name_kana?.message}
        />
        <TextField
          label="メールアドレス"
          type="email"
          fullWidth
          required
          {...register("email", {
            required: "メールアドレスを入力してください",
            pattern: {
              value: /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/,
              message: "メールアドレスの形式が正しくありません",
            },
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          label="電話番号"
          fullWidth
          placeholder="ハイフンなし"
          // フォーカス時にブラウザのオートフィル候補で入力欄がグレーに
          // 塗られるのを抑止する（autofill 背景を box-shadow で打ち消す）
          autoComplete="off"
          sx={{
            "& input:-webkit-autofill, & input:-webkit-autofill:focus, & input:-webkit-autofill:hover":
              {
                WebkitBoxShadow: "0 0 0 1000px #fff inset",
                WebkitTextFillColor: "inherit",
                transition: "background-color 9999s ease-in-out 0s",
              },
          }}
          {...register("phone_number", {
            pattern: {
              value: /^\d{10,11}$/,
              message: "電話番号は数字10〜11桁で入力してください",
            },
          })}
          error={!!errors.phone_number}
          helperText={errors.phone_number?.message}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="生年月日"
                format="yyyy-MM-dd"
                maxDate={new Date()}
                referenceDate={
                  field.value ? new Date(field.value) : BIRTHDAY_REFERENCE_DATE
                }
                value={field.value ? new Date(field.value) : null}
                onChange={(date) =>
                  field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}
          />
        </LocalizationProvider>

        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup row {...field}>
              <FormControlLabel value="male" control={<Radio />} label="男" />
              <FormControlLabel value="female" control={<Radio />} label="女" />
              <FormControlLabel
                value="other"
                control={<Radio />}
                label="その他"
              />
            </RadioGroup>
          )}
        />

        <Controller
          name="prefecture_id"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="都道府県"
              fullWidth
              value={field.value ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
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

        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <Autocomplete
              disabled={!prefectureId}
              options={mergedCityOptions}
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
                <TextField {...params} fullWidth label="市区町村" />
              )}
            />
          )}
        />

        <Controller
          name="town"
          control={control}
          render={({ field }) => (
            <Autocomplete
              disabled={!city}
              options={mergedTownOptions}
              value={
                mergedTownOptions.find(
                  (option) => option.town === field.value,
                ) || null
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.town}
              onChange={(_, value) => field.onChange(value?.town || "")}
              renderInput={(params) => (
                <TextField {...params} fullWidth label="町名・丁目" />
              )}
            />
          )}
        />
      </Stack>

      <Box
        sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1.5 }}
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
