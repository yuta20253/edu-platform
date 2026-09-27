"use client";

import { colors } from "@/app/theme/colors";
import { PrimaryCta } from "@/components/PrimaryCta";
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { useSubmit } from "./hooks";
import { LoginFormType } from "@/types/login/form";

export const Login = (): React.JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const { onSubmit } = useSubmit({ setErrorMessage });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <Box sx={{ width: 40, height: 6, bgcolor: "primary.main" }} />
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800, mt: 2.25 }}
        >
          おかえりなさい
        </Typography>
        <Typography variant="body2" color="text.secondary">
          学習App(仮) にログイン
        </Typography>
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Box sx={{ py: 2, width: "100%" }}>
          <Box
            component="form"
            sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 3 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography>メールアドレス</Typography>
              <TextField
                fullWidth
                variant="outlined"
                {...register("email", {
                  required: "メールアドレスを入力してください",
                  pattern: {
                    value: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                    message: "メールアドレスの形式が正しくありません",
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>パスワード</Typography>
              <TextField
                type={showPassword ? "text" : "password"}
                fullWidth
                variant="outlined"
                {...register("password", {
                  required: "パスワードを入力してください",
                  minLength: {
                    value: 8,
                    message: "8文字以上で入力してください",
                  },
                })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </Box>
            <Box sx={{ my: 4 }}>
              <PrimaryCta type="submit" sx={{ justifyContent: "center" }}>
                ログイン
              </PrimaryCta>
            </Box>
            <Box sx={{ width: "100%", textAlign: "center", fontSize: 13 }}>
              <Link
                href="/password/reset"
                style={{ color: colors.accent[600] }}
              >
                パスワードをお忘れの方はこちら
              </Link>
            </Box>
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                fontSize: 13,
                color: "text.secondary",
                mt: 2,
              }}
            >
              アカウントをお持ちでない方は
              <Link
                href="/signup"
                style={{ color: colors.accent[600], marginLeft: 4 }}
              >
                新規作成
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
