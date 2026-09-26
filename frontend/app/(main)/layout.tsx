import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import studentTheme from "../theme/studentTheme";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={studentTheme}>
      <CssBaseline />
      <Box
        display="flex"
        flexDirection="column"
        minHeight="100vh"
        bgcolor="background.default"
        className={inter.className}
      >
        <Box p={2} pb={9} maxWidth="960px" width="100%" margin="0 auto">
          {children}
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
