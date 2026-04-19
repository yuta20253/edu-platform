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
import { Controller } from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";
import { useMemo, useEffect } from "react";

import { useSubmit } from "./hooks/useSubmit";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { useFetchAddresses } from "./hooks/useFetchAddresses";

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
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useDefaultValues(user);

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

  const initialCityOptions = useMemo(() => {
    return user.address ? [user.address.city] : [];
  }, [user.address]);

  const initialTownOptions = useMemo(() => {
    return user.address
      ? [
          {
            id: user.address.id,
            city: user.address.city,
            town: user.address.town,
          },
        ]
      : [];
  }, [user.address]);

  const { onSubmit } = useSubmit(townOptions, user);

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

  /**
   * 初期表示でも変更後でも
   * town に対応する address_id を同期
   */
  useEffect(() => {
    if (!town) {
      setValue("address_id", null);
      return;
    }

    const selected = mergedTownOptions.find((item) => item.town === town);

    if (selected) {
      setValue("address_id", selected.id);
    } else {
      setValue("address_id", null);
    }
  }, [town, mergedTownOptions, setValue]);

  return (
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
              <TextField {...register("phone1")} />
              <TextField {...register("phone2")} />
              <TextField {...register("phone3")} />
            </Box>

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
                  options={mergedTownOptions}
                  value={
                    mergedTownOptions.find(
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
                    <TextField {...params} fullWidth placeholder="町名・丁目" />
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
  );
};
