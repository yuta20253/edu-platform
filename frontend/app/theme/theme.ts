"use client";

import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

declare module "@mui/material/styles" {
  interface Palette {
    admin: { main: string };
  }
  interface PaletteOptions {
    admin?: { main: string };
  }
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.brand.primary,
    },
    secondary: {
      main: colors.brand.secondary,
    },
    admin: {
      main: colors.brand.admin,
    },
  },
  typography: {
    fontFamily: ['"Roboto"', "sans-serif"].join(","),
  },
});

export default theme;
