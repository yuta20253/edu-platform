"use client";

import { useState } from "react";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { RequestForm } from "./types";
import { useSubmit } from "./hooks/useSubmit";

export const PasswordResetRequest = () => {
  const [sent, setSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestForm>();

  const { onSubmit } = useSubmit({ setSent, setErrorMessage });
  return (
    <Presenter
      sent={sent}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      errors={errors}
    />
  );
};
