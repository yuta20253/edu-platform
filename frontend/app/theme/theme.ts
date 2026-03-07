"use client";

import { createTheme } from "@mui/material/styles";

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
      main: "#0068b7",
    },
    secondary: {
      main: "#F2A541",
    },
    admin: {
      main: "#e65100",
    },
  },
  typography: {
    fontFamily: ['"Roboto"', "sans-serif"].join(","),
  },
});

export default theme;
