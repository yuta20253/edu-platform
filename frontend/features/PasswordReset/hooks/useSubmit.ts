"use client";

import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { NewPasswordForm } from "../types";
import { apiClient } from "@/libs/http/apiClient";

type SubmitProps = {
  token: string;
  setErrorMessage: (m: string) => void;
  setIsSubmitting: (b: boolean) => void;
};

export const useSubmit = ({ token, setErrorMessage, setIsSubmitting }: SubmitProps) => {
  const router = useRouter();

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await updatePassword(token, data);
      router.push("/login?reset=done");
    } catch (e) {
      console.error("パスワード更新に失敗", e);
      setErrorMessage(
        "パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
};

const updatePassword = async (token: string, data: NewPasswordForm) => {
  await apiClient.patch("/api/auth/password-reset", {
    password_reset: {
      reset_password_token: token,
      password: data.password,
      password_confirmation: data.password_confirmation,
    },
  });
};
