import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import { RequestForm } from "./types";

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
  sent = false,
  errorMessage = "",
}: {
  sent?: boolean;
  errorMessage?: string;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestForm>();

  return (
    <Presenter
      sent={sent}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onValid)}
      register={register}
      errors={errors}
    />
  );
};

describe("PasswordResetRequest Presenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("入力フォーム", () => {
    it("見出し・説明・入力欄・送信ボタンが表示される", () => {
      render(<Harness />);
      expect(
        screen.getByRole("heading", { name: "パスワード再設定" }),
      ).toBeInTheDocument();
      expect(screen.getByText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "再設定リンクを送信" }),
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
      await userEvent.click(
        screen.getByRole("button", { name: "再設定リンクを送信" }),
      );

      expect(
        await screen.findByText("メールアドレスを入力してください"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });

    it("メールアドレスの形式が不正だとエラーが表示される", async () => {
      render(<Harness />);
      await userEvent.type(screen.getByRole("textbox"), "not-an-email");
      await userEvent.click(
        screen.getByRole("button", { name: "再設定リンクを送信" }),
      );

      expect(
        await screen.findByText("メールアドレスの形式が正しくありません"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });

    it("正しいメールアドレスで送信すると入力内容が渡される", async () => {
      render(<Harness />);
      await userEvent.type(screen.getByRole("textbox"), "hina@example.com");
      await userEvent.click(
        screen.getByRole("button", { name: "再設定リンクを送信" }),
      );

      await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
      expect(onValid.mock.calls[0][0]).toEqual({ email: "hina@example.com" });
    });

    it("errorMessage があるとエラーが表示される", () => {
      render(<Harness errorMessage="送信に失敗しました" />);
      expect(screen.getByRole("alert")).toHaveTextContent("送信に失敗しました");
    });
  });

  describe("送信完了", () => {
    it("完了メッセージが表示され、入力フォームは表示されない", () => {
      render(<Harness sent />);
      expect(screen.getByText("メールを送信しました")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "再設定リンクを送信" }),
      ).not.toBeInTheDocument();
    });

    it("ログインに戻るリンクが /login を指している", () => {
      render(<Harness sent />);
      expect(
        screen.getByRole("link", { name: "ログインに戻る" }),
      ).toHaveAttribute("href", "/login");
    });
  });
});
