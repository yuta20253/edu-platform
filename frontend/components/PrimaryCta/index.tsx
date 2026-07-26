"use client";

import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  /** 主ボタン(塗り) か 副ボタン(枠) か */
  variant?: "contained" | "outlined";
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  startIcon?: ReactNode;
  sx?: SxProps<Theme>;
};

/** 全幅・大きめの主要 CTA。href があれば Link、なければ onClick ボタン。 */
export const PrimaryCta = ({
  children,
  href,
  onClick,
  variant = "contained",
  fullWidth = true,
  type = "button",
  disabled,
  startIcon,
  sx,
}: Props): React.JSX.Element => {
  const common = {
    size: "large" as const,
    variant,
    fullWidth,
    disabled,
    startIcon,
    sx: { fontWeight: 800, ...sx },
  };

  if (href) {
    return (
      <Button LinkComponent={Link} href={href} {...common}>
        {children}
      </Button>
    );
  }

  return (
    <Button type={type} onClick={onClick} {...common}>
      {children}
    </Button>
  );
};
