"use client";

import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { LoginFormType } from "@/types/login/form";

type LoginProps = {
  setErrorMessage: (message: string) => void;
};

type ErrorResponse = {
  errors?: string[] | string;
};

type LoginResponse = {
  user?: {
    user_role?: {
      name?: string;
    };
  };
};

export const useSubmit = ({ setErrorMessage }: LoginProps) => {
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginFormType> = async (
    data: LoginFormType,
  ) => {
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      });

      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => null)) as ErrorResponse | null;

        const messageFromApi =
          typeof body?.errors === "string"
            ? body.errors
            : Array.isArray(body?.errors)
              ? body.errors[0]
              : null;

        throw new Error(messageFromApi ?? "ログインに失敗しました");
      }
      const body = (await response
        .json()
        .catch(() => null)) as LoginResponse | null;
      const isAdmin = body?.user?.user_role?.name === "admin";
      router.push(isAdmin ? "/admin/dashboard" : "/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "不明なエラーが発生しました";

      setErrorMessage(message);
    }
  };
  return { onSubmit };
};
