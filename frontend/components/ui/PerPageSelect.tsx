"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useId } from "react";

type Props = {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  label?: string;
};

// 表示件数セレクト。画面によってonChangeがnumber/stringとバラバラだった
// ため、valueをnumberに統一する。文字列との変換はこの中で完結させる。
export const PerPageSelect = ({
  value,
  options,
  onChange,
  label = "表示件数",
}: Props) => {
  const labelId = useId();

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(Number(event.target.value));
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={String(value)}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option} value={String(option)}>
            {option}件
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
