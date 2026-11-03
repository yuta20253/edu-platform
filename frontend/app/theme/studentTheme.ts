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

/**
 * カードの中のリンクに付けて、押せる範囲をカード全体に広げる(stretched link)。
 * カードには position: "relative" を付ける。
 * カードの中に押せる要素(ボタンなど)を足すときは、その要素に
 * position: "relative", zIndex: 1 を付けないと、この ::after に隠れて押せなくなる
 */
export const stretchedLinkSx = {
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    // カードと同じ角丸にする。"inherit" はタイトルから引き継ぐので 0 になる。
    // 数値の radius.md は sx では theme.shape.borderRadius 倍になるので、文字列の値を使う
    borderRadius: cardSx.borderRadius,
  },
  "&:focus-visible": { outline: "none" },
  "&:focus-visible::after": { outline: "2px solid", outlineOffset: 2 },
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
