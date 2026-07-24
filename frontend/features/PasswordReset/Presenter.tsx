"use client";

import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { FieldErrors, UseFormRegister } from "react-hook-form";

import { PrimaryCta } from "@/components/PrimaryCta";
import { NewPasswordForm } from "./types";
import { Dispatch, SetStateAction } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type Props = {
  verifying: boolean;
  tokenValid: boolean;
  register: UseFormRegister<NewPasswordForm>;
  errors: FieldErrors<NewPasswordForm>;
  errorMessage: string;
  password?: string;
  onSubmit: () => void;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  toggeleShowPassword: Dispatch<SetStateAction<boolean>>;
  toggeleShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
};

export const Presenter = ({
  verifying,
  tokenValid,
  register,
  errors,
  errorMessage,
  password,
  onSubmit,
  showPassword,
  showConfirmPassword,
  isSubmitting,
  toggeleShowPassword,
  toggeleShowConfirmPassword,
}: Props) => {
  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        {!tokenValid ? (
          <>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                textAlign: "center",
                mb: 2,
              }}
            >
              リンクが無効です
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 4 }}
            >
              このリンクは無効、または有効期限が切れています。
              <br />
              お手数ですが、もう一度パスワード再設定を行ってください。
            </Typography>

            <PrimaryCta href="/password/reset">
              パスワード再設定をやり直す
            </PrimaryCta>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Link href="/login">ログインへ戻る</Link>
            </Box>
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                textAlign: "center",
                mb: 1,
              }}
            >
              パスワード再設定
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 4 }}
            >
              新しいパスワードを入力してください。
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} noValidate>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                  新しいパスワード
                </Typography>

                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
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
                            onClick={() => toggeleShowPassword((prev) => !prev)}
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

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                  新しいパスワード（確認）
                </Typography>

                <TextField
                  fullWidth
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("password_confirmation", {
                    required: "確認用パスワードを入力してください",
                    validate: (value) =>
                      value === password || "パスワードが一致しません",
                  })}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() =>
                              toggeleShowConfirmPassword((prev) => !prev)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  error={!!errors.password_confirmation}
                  helperText={errors.password_confirmation?.message}
                />
              </Box>

              <PrimaryCta type="submit" disabled={isSubmitting}>パスワードを更新する</PrimaryCta>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Link href="/login">ログインへ戻る</Link>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
