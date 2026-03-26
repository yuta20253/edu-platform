import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "../theme/theme";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={inter.className}>{children}</div>
    </ThemeProvider>
  );
}
