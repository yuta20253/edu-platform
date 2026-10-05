"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { AccountLinkForm } from "../types";

export const useSubmit = () => {
  const router = useRouter();

  const onSubmit: SubmitHandler<AccountLinkForm> = async (data) => {
    await apiClient.post("/api/student/account-link", {
      student_number: data.student_number,
    });

    router.push("/");
  };

  return { onSubmit };
};
