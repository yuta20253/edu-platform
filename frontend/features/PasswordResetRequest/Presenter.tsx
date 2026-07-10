"use client";

import { Alert, Box, TextField, Typography } from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import Link from "next/link";
import { FieldErrors, UseFormRegister } from "react-hook-form";

import { PrimaryCta } from "@/components/PrimaryCta";
import { RequestForm } from "./types";

type Props = {
  sent: boolean;
  errorMessage: string;
  onSubmit: () => void;
  register: UseFormRegister<RequestForm>;
  errors: FieldErrors<RequestForm>;
};

export const Presenter = ({
  sent,
  errorMessage,
  onSubmit,
  register,
  errors,
}: Props) => {
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
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        {sent ? (
          <>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <MarkEmailReadRoundedIcon
                sx={{
                  fontSize: 64,
                  color: "primary.main",
                  mb: 2,
                }}
              />

              <Typography variant="h5" fontWeight="bold">
                メールを送信しました
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                ご入力いただいたメールアドレス宛に、
                パスワード再設定用のメールを送信しました。
                <br />
                メールが届かない場合は、 迷惑メールフォルダもご確認ください。
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
                <Link href="/login">
                    ログインに戻る
                </Link>
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
              ご登録のメールアドレスを入力してください。
              <br />
              パスワード再設定用のリンクを送信します。
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} noValidate>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                  メールアドレス
                </Typography>

                <TextField
                  fullWidth
                  type="email"
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

              <PrimaryCta type="submit">再設定リンクを送信</PrimaryCta>

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
