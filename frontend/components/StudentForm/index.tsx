"use client";

import { colors } from "@/app/theme/colors";
import { cardSx } from "@/app/theme/studentTheme";
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

/**
 * フォーム項目の見出しラベル(入力欄の上に置く)。
 * htmlFor は input 系、id は MUI Select の labelId に渡して入力欄と関連付ける。
 */
export const FormLabel = ({
  children,
  htmlFor,
  id,
}: {
  children: ReactNode;
  htmlFor?: string;
  id?: string;
}): React.JSX.Element => (
  <Typography
    component="label"
    htmlFor={htmlFor}
    id={id}
    sx={{ display: "block", fontSize: 13, fontWeight: 700, mb: 0.75 }}
  >
    {children}
  </Typography>
);

/** 見出し付きの白いカード。講座選択・確認画面の各ブロックに使う */
export const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.JSX.Element => (
  <Box sx={{ ...cardSx, mt: 3, overflow: "hidden" }}>
    <Typography
      component="h2"
      sx={{
        px: 2.5,
        py: 1.5,
        fontSize: 15,
        fontWeight: 800,
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      {title}
    </Typography>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Box>
);
