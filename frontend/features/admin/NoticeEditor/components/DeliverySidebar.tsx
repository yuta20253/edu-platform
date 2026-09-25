"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ja } from "date-fns/locale";
import { Controller, type Control } from "react-hook-form";
import type { DeliveryTiming, NoticeFormValues } from "../types";

type Props = {
  control: Control<NoticeFormValues>;
  deliveryTiming: DeliveryTiming;
};

const DELIVERY_TIMING_OPTIONS: { value: DeliveryTiming; label: string }[] = [
  { value: "draft", label: "下書き保存" },
  { value: "immediate", label: "即時配信" },
  { value: "scheduled", label: "予約配信" },
];

export const DeliverySidebar = ({ control, deliveryTiming }: Props) => {
  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          配信対象
        </Typography>
        <Typography sx={{ mb: 0.5 }}>全ユーザー</Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted, mb: 3 }}>
          特定の高校・学年への配信は教師機能で行います
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          配信タイミング
        </Typography>
        <Controller
          name="deliveryTiming"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field}>
              {DELIVERY_TIMING_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          )}
        />

        {deliveryTiming === "scheduled" && (
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ja}
            >
              <Controller
                name="scheduledAt"
                control={control}
                rules={{
                  validate: (value) => {
                    if (deliveryTiming !== "scheduled") return true;
                    if (!value) return "配信日時を指定してください";
                    if (value.getTime() <= Date.now()) {
                      return "未来の日時を指定してください";
                    }
                    return true;
                  },
                }}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="配信日時"
                    format="yyyy/MM/dd HH:mm"
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    minDateTime={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
