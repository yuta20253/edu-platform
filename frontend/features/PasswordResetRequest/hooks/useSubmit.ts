"use client";

import { apiClient } from "@/libs/http/apiClient";
import { RequestForm } from "../types";
import { SubmitHandler } from "react-hook-form";

type Props = {
  setSent: (v: boolean) => void;
  setErrorMessage: (m: string) => void;
};

export const useSubmit = ({ setSent, setErrorMessage }: Props) => {
  const onSubmit: SubmitHandler<RequestForm> = async (data: RequestForm) => {
    setErrorMessage("");

    try {
      await apiClient.post("/api/auth/password-reset-request", {
        email: data.email,
      });

      setSent(true);
    } catch (error) {
      console.error("再設定リクエストに失敗", error);
      setErrorMessage("送信に失敗しました。時間をおいて再度お試しください。");
    }
  };

  return { onSubmit };
};
