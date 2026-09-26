import { CssBaseline, ThemeProvider } from "@mui/material";
import { ToastProvider } from "@/components/ui/ToastProvider";
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
      <ToastProvider>
        <div className={inter.className}>{children}</div>
      </ToastProvider>
    </ThemeProvider>
  );
}
