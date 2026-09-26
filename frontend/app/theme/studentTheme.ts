"use client";

import { createTheme } from "@mui/material/styles";
import baseTheme from "./theme";
import { colors } from "./colors";

/** 生徒UI用のテーマ。教員・管理者画面には影響させないため (main) レイアウトでのみ使う */
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
} as const;

/** 生徒UIの白いカード(角丸 + 薄い影) */
export const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

const studentTheme = createTheme(baseTheme, {
  palette: {
    primary: {
      main: colors.accent[600],
      dark: colors.accent[700],
      light: colors.accent[300],
      contrastText: colors.text.inverse,
    },
    background: {
      default: colors.surface.default,
      paper: colors.surface.white,
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: radius.sm },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: radius.md },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radius.md },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 700 },
      },
    },
  },
});

export default studentTheme;
