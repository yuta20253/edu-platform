"use client";

import { colors } from "@/app/theme/colors";
import { AppBar } from "@mui/material";
import { Box, Button } from "@mui/material";
import ToolBar from "@mui/material/Toolbar";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX } from "react";
import { MeUser } from "@/libs/server/me";

export const Presenter = ({ user }: { user: MeUser | null }): JSX.Element => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <AppBar
        position="fixed"
        sx={isAdmin ? { bgcolor: "admin.main" } : undefined}
      >
        <ToolBar>
          <Box sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}>
            <Link
              href="/"
              aria-label="ホームヘ"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  letterSpacing: "0.25em",
                  textShadow: `0 0 6px ${colors.shadow.header}`,
                }}
              >
                学習App(仮)
              </span>
            </Link>
          </Box>
          {user ? (
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                color: colors.text.inverse,
              }}
            >
              <AccountCircleIcon />
              {user.name}
            </Link>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                LinkComponent={Link}
                color="inherit"
                variant="outlined"
                href="/login"
              >
                ログイン
              </Button>
              <Button
                LinkComponent={Link}
                color="inherit"
                variant="outlined"
                href="/signup"
              >
                新規作成
              </Button>
            </Box>
          )}
        </ToolBar>
      </AppBar>
    </>
  );
};
