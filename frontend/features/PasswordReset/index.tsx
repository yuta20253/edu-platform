"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { useVerifyToken } from "./hooks/useVerifyToken";
import { NewPasswordForm } from "./types";
import { useSubmit } from "../PasswordReset/hooks/useSubmit";

type Props = {
  token: string;
};

export const PasswordReset = ({ token }: Props): React.JSX.Element => {
  const { verifying, tokenValid } = useVerifyToken(token);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordForm>();
  const { onSubmit } = useSubmit({ token, setErrorMessage });

  return (
    <Presenter
      verifying={verifying}
      tokenValid={tokenValid}
      register={register}
      errors={errors}
      errorMessage={errorMessage}
      password={watch("password")}
      onSubmit={handleSubmit(onSubmit)}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      toggeleShowPassword={setShowPassword}
      toggeleShowConfirmPassword={setShowConfirmPassword}
    />
  );
};
