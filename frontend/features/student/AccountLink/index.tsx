"use client";

import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { ConfirmPresenter } from "./ConfirmPresenter";
import { useAccountLink } from "./hooks/useAccountLink";
import { AccountLinkForm } from "./types";

export const AccountLink = (): React.JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountLinkForm>();
  const {
    step,
    onPreviewSubmit,
    previewError,
    preview,
    onBack,
    onConfirm,
    confirmError,
    confirming,
    isLinked,
  } = useAccountLink();

  if (step === "confirm" && preview) {
    return (
      <ConfirmPresenter
        preview={preview}
        errorMessage={confirmError}
        onConfirm={onConfirm}
        onBack={onBack}
        disabled={confirming || isLinked}
      />
    );
  }

  return (
    <Presenter
      register={register}
      errors={errors}
      errorMessage={previewError}
      onSubmit={handleSubmit(onPreviewSubmit)}
      isSubmitting={isSubmitting}
    />
  );
};
