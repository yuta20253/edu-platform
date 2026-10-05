import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { AccountLinkForm } from "./types";

const Wrapper = ({
  errorMessage = "",
  onSubmit = vi.fn(),
  isSubmitting = false,
}: {
  errorMessage?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountLinkForm>();

  return (
    <Presenter
      register={register}
      errors={errors}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  );
};

describe("Presenter", () => {
  it("見出し・入力フィールド・送信ボタンが表示される", () => {
    render(<Wrapper />);
    expect(screen.getByText("アカウント紐付け")).toBeInTheDocument();
    expect(screen.getByText("生徒コード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "紐付ける" }),
    ).toBeInTheDocument();
  });

  it("未入力で送信すると生徒コードのエラーが表示される", async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "紐付ける" }));

    expect(
      await screen.findByText("生徒コードを入力してください"),
    ).toBeInTheDocument();
  });

  it("errorMessageが渡されるとAlertが表示される", () => {
    render(<Wrapper errorMessage="入力された生徒コードが見つかりません" />);
    expect(
      screen.getByText("入力された生徒コードが見つかりません"),
    ).toBeInTheDocument();
  });

  it("送信中は送信ボタンがdisabledになり二重送信を防ぐ", () => {
    render(<Wrapper isSubmitting={true} />);
    expect(screen.getByRole("button", { name: "紐付ける" })).toBeDisabled();
  });
});
