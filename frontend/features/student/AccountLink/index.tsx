"use client";

import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { useSubmit } from "./hooks/useSubmit";
import { AccountLinkForm } from "./types";

export const AccountLink = (): React.JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountLinkForm>();
  const { onSubmit, errorMessage, toast, closeToast } = useSubmit();

  return (
    <Presenter
      register={register}
      errors={errors}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
      toast={toast}
      closeToast={closeToast}
    />
  );
};
