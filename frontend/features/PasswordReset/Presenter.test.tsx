import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import { NewPasswordForm } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const onValid = vi.fn();

const Harness = ({
  verifying = false,
  tokenValid = true,
  errorMessage = "",
  isSubmitting = false,
}: {
  verifying?: boolean;
  tokenValid?: boolean;
  errorMessage?: string;
  isSubmitting?: boolean;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordForm>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Presenter
      verifying={verifying}
      tokenValid={tokenValid}
      register={register}
      errors={errors}
      errorMessage={errorMessage}
      password={watch("password")}
      onSubmit={handleSubmit(onValid)}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isSubmitting={isSubmitting}
      toggeleShowPassword={setShowPassword}
      toggeleShowConfirmPassword={setShowConfirmPassword}
    />
  );
};

const passwordInput = () =>
  document.querySelector<HTMLInputElement>('input[name="password"]')!;
const confirmInput = () =>
  document.querySelector<HTMLInputElement>(
    'input[name="password_confirmation"]',
  )!;

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "パスワードを更新する" }));

describe("PasswordReset Presenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("トークン確認中はローディングだけが表示される", () => {
    render(<Harness verifying />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  describe("トークンが無効なとき", () => {
    it("無効を伝える見出しが表示され、入力フォームは表示されない", () => {
      render(<Harness tokenValid={false} />);
      expect(
        screen.getByRole("heading", { name: "リンクが無効です" }),
      ).toBeInTheDocument();
      expect(passwordInput()).toBeNull();
    });

    it("やり直しのリンクが /password/reset を指している", () => {
      render(<Harness tokenValid={false} />);
      expect(
        screen.getByRole("link", { name: "パスワード再設定をやり直す" }),
      ).toHaveAttribute("href", "/password/reset");
    });

    it("ログインへ戻るリンクが /login を指している", () => {
      render(<Harness tokenValid={false} />);
      expect(
        screen.getByRole("link", { name: "ログインへ戻る" }),
      ).toHaveAttribute("href", "/login");
    });
  });

  describe("トークンが有効なとき", () => {
    it("見出し・入力欄・更新ボタンが表示される", () => {
      render(<Harness />);
      expect(
        screen.getByRole("heading", { name: "パスワード再設定" }),
      ).toBeInTheDocument();
      expect(screen.getByText("新しいパスワード")).toBeInTheDocument();
      expect(screen.getByText("新しいパスワード（確認）")).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(confirmInput()).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "パスワードを更新する" }),
      ).toBeInTheDocument();
    });

    it("ログインへ戻るリンクが /login を指している", () => {
      render(<Harness />);
      expect(
        screen.getByRole("link", { name: "ログインへ戻る" }),
      ).toHaveAttribute("href", "/login");
    });

    it("未入力で送信すると必須エラーが表示され、送信されない", async () => {
      render(<Harness />);
      await submit();

      expect(
        await screen.findByText("パスワードを入力してください"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("確認用パスワードを入力してください"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });

    it("パスワードが8文字未満だとエラーが表示される", async () => {
      render(<Harness />);
      await userEvent.type(passwordInput(), "short");
      await userEvent.type(confirmInput(), "short");
      await submit();

      expect(
        await screen.findByText("8文字以上で入力してください"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });

    it("確認用パスワードが一致しないとエラーが表示される", async () => {
      render(<Harness />);
      await userEvent.type(passwordInput(), "password123");
      await userEvent.type(confirmInput(), "different123");
      await submit();

      expect(
        await screen.findByText("パスワードが一致しません"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });

    it("一致する8文字以上のパスワードで送信すると入力内容が渡される", async () => {
      render(<Harness />);
      await userEvent.type(passwordInput(), "password123");
      await userEvent.type(confirmInput(), "password123");
      await submit();

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
      expect(onValid.mock.calls[0][0]).toEqual({
        password: "password123",
        password_confirmation: "password123",
      });
    });

    it("目のアイコンでそれぞれの表示・非表示が独立して切り替わる", async () => {
      render(<Harness />);
      const [toggleMain, toggleConfirm] = screen.getAllByRole("button", {
        name: "toggle password visibility",
      });

      await userEvent.click(toggleMain);
      expect(passwordInput()).toHaveAttribute("type", "text");
      expect(confirmInput()).toHaveAttribute("type", "password");

      await userEvent.click(toggleConfirm);
      expect(confirmInput()).toHaveAttribute("type", "text");
    });

    it("送信中は更新ボタンが無効になる", () => {
      render(<Harness isSubmitting />);
      expect(
        screen.getByRole("button", { name: "パスワードを更新する" }),
      ).toBeDisabled();
    });

    it("errorMessage があるとエラーが表示される", () => {
      render(<Harness errorMessage="更新に失敗しました" />);
      expect(screen.getByRole("alert")).toHaveTextContent("更新に失敗しました");
    });
  });
});
