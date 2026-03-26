import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import theme from "../theme/theme";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        display="flex"
        flexDirection="column"
        minHeight="100vh"
        className={inter.className}
      >
        <Header />
        <Box p={2} maxWidth="960px" width="100%" margin="0 auto">
          {children}
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
